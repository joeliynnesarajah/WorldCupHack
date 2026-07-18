import "dotenv/config";
import express, { type Request, type Response } from "express";
import cors from "cors";
import axios from "axios";
import * as config from "./common/config";
import { renewJwt, userAuthMap, apiClient, type UserAuthState } from "./common/users";

// ---------------------------------------------------------
// Thin local proxy between the Oracle Room frontend and the
// TxODDS TxLINE API (https://txline.txodds.com/api-reference).
//
// The browser never talks to TxLINE directly: it would need a
// guest JWT stored somewhere and TxLINE does not send permissive
// CORS headers for browser-originated requests. This server holds
// the guest session and forwards frontend requests server-side.
// ---------------------------------------------------------

const PORT = Number(process.env.PORT) || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
const SESSION_NAME = "oracle-room-frontend";

const app = express();
app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json());

// renewJwt() only writes the new token into userAuthMap for names that
// already have an entry there, so the entry must exist before it's called.
//
// TXLINE_API_TOKEN lets you skip the on-chain subscribe+activate flow on
// every restart: run it once via `npx tsx src/main.ts`, copy the printed
// "API Token:" value into .env, and the server reuses it directly.
function getOrCreateSessionState(): UserAuthState {
  let state = userAuthMap.get(SESSION_NAME);
  if (!state) {
    state = {
      apiToken: process.env.TXLINE_API_TOKEN || "",
      jwt: "",
      isRefreshing: false,
      refreshSubscribers: [],
    };
    userAuthMap.set(SESSION_NAME, state);
  }
  return state;
}

async function ensureSession(): Promise<string> {
  const state = getOrCreateSessionState();
  if (state.jwt) return state.jwt;
  return renewJwt(SESSION_NAME);
}

// Guarantee a session exists before any request is handled, and make
// sure the frontend's requests are tagged so users.ts's per-user auth
// map (rather than the global fallback) is used.
app.use(async (req, _res, next) => {
  if (req.path === "/api/session" || req.path === "/api/health") return next();
  try {
    await ensureSession();
    next();
  } catch (err) {
    next(err);
  }
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", txlineBaseUrl: config.TXLINE_BASE_URL });
});

// Mirrors https://txline.txodds.com/api-reference/authentication/start-a-new-guest-session
app.post("/api/session", async (_req: Request, res: Response) => {
  try {
    getOrCreateSessionState();
    const token = await renewJwt(SESSION_NAME);
    res.json({ token });
  } catch (err) {
    res.status(502).json({ error: "Failed to start TxLINE guest session", detail: String(err) });
  }
});

app.get("/api/fixtures", async (req: Request, res: Response) => {
  try {
    const response = await apiClient.get("/fixtures/snapshot", {
      params: req.query,
      // @ts-expect-error - userName is a custom field read by the users.ts interceptor
      userName: SESSION_NAME,
    });
    res.json(response.data);
  } catch (err) {
    forwardAxiosError(err, res);
  }
});

// Proxies a TxLINE live SSE feed so the browser can subscribe with a plain
// EventSource against our own origin (no CORS/auth header juggling
// client-side).
function proxySseFeed(upstreamPath: string) {
  return async (req: Request, res: Response) => {
    const state = userAuthMap.get(SESSION_NAME)!;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const controller = new AbortController();
    req.on("close", () => controller.abort());

    try {
      const upstream = await axios.get(`${config.API_BASE_URL}${upstreamPath}`, {
        headers: {
          Authorization: `Bearer ${state.jwt}`,
          "X-Api-Token": state.apiToken,
          "Accept-Encoding": "deflate",
        },
        responseType: "stream",
        signal: controller.signal,
      });

      // Re-emit every upstream message as the default (unnamed) SSE event.
      // TxLINE sends some messages as named events (e.g. "event: heartbeat"),
      // which a plain `EventSource.onmessage` in the browser silently ignores
      // — and we don't know every event name TxLINE might use for real data.
      // Stripping the "event:" field guarantees onmessage fires for
      // everything; callers filter by payload content (FixtureId) instead.
      let buffer = "";
      upstream.data.on("data", (chunk: Buffer) => {
        buffer += chunk.toString("utf8");
        const messages = buffer.split("\n\n");
        buffer = messages.pop() ?? "";
        for (const message of messages) {
          const dataLines = message
            .split("\n")
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).trim());
          if (dataLines.length > 0) {
            res.write(`data: ${dataLines.join("")}\n\n`);
          }
        }
      });
      upstream.data.on("end", () => res.end());
      upstream.data.on("error", () => res.end());
    } catch (err) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: `Upstream TxLINE ${upstreamPath} connection failed` })}\n\n`);
      res.end();
    }
  };
}

// These MUST be registered before the /:fixtureId routes below — Express
// matches routes in registration order, so "/api/odds/:fixtureId" would
// otherwise swallow "/api/odds/stream" as if "stream" were a fixture ID.
app.get("/api/odds/stream", proxySseFeed("/odds/stream"));
app.get("/api/scores/stream", proxySseFeed("/scores/stream"));

app.get("/api/odds/:fixtureId", async (req: Request, res: Response) => {
  try {
    const { fixtureId } = req.params;
    const response = await apiClient.get(`/odds/snapshot/${fixtureId}`, {
      params: req.query.asOf ? { asOf: req.query.asOf } : undefined,
      // @ts-expect-error - userName is a custom field read by the users.ts interceptor
      userName: SESSION_NAME,
    });
    res.json(response.data);
  } catch (err) {
    forwardAxiosError(err, res);
  }
});

// Real goal/card/period events live on the scores feed, not the odds feed.
app.get("/api/scores/:fixtureId", async (req: Request, res: Response) => {
  try {
    const { fixtureId } = req.params;
    const response = await apiClient.get(`/scores/snapshot/${fixtureId}`, {
      // @ts-expect-error - userName is a custom field read by the users.ts interceptor
      userName: SESSION_NAME,
    });
    res.json(response.data);
  } catch (err) {
    forwardAxiosError(err, res);
  }
});

function forwardAxiosError(err: unknown, res: Response) {
  if (axios.isAxiosError(err) && err.response) {
    res.status(err.response.status).json(err.response.data ?? { error: err.message });
    return;
  }
  res.status(502).json({ error: "Upstream TxLINE request failed", detail: String(err) });
}

app.listen(PORT, () => {
  console.log(`[server] Oracle Room API proxy listening on http://localhost:${PORT}`);
  console.log(`[server] Forwarding to TxLINE at ${config.TXLINE_BASE_URL}`);
  console.log(`[server] Allowing requests from ${FRONTEND_ORIGIN}`);
});
