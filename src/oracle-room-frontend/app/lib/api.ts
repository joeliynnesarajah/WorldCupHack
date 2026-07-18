// Client for the local Oracle Room API proxy (see src/server.ts at the repo
// root), which itself forwards to TxODDS TxLINE:
// https://txline-docs.txodds.com (devnet host: txline-dev.txodds.com/api)
//
// Field names below are PascalCase to match TxLINE's actual REST responses
// (verified against live /fixtures/snapshot, /odds/snapshot, /scores/snapshot
// calls) — this is a different shape than the camelCase on-chain IDL structs
// used for merkle proofs, so don't copy those types here.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export type Fixture = {
  Ts: number;
  StartTime: number;
  Competition: string;
  CompetitionId: number;
  FixtureGroupId: number;
  Participant1Id: number;
  Participant1: string;
  Participant2Id: number;
  Participant2: string;
  FixtureId: number;
  Participant1IsHome: boolean;
  GameState?: number;
};

export type OddsSnapshot = {
  FixtureId: number;
  MessageId: string;
  Ts: number;
  Bookmaker: string;
  BookmakerId: number;
  SuperOddsType: string;
  GameState?: string | null;
  InRunning: boolean;
  MarketParameters?: string | null;
  MarketPeriod?: string | null;
  PriceNames: string[];
  Prices: number[];
};

export type ScoreEvent = {
  FixtureId: number;
  GameState: string;
  StartTime: number;
  CompetitionId: number;
  Participant1Id: number;
  Participant2Id: number;
  Action: string;
  Id: number;
  Ts: number;
  Seq: number;
  Data?: Record<string, unknown>;
  Stats?: Record<string, unknown>;
};

async function getJson<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(path, API_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, String(value));
    });
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Request to ${path} failed: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export async function startGuestSession(): Promise<{ token: string }> {
  const response = await fetch(`${API_BASE_URL}/api/session`, { method: "POST" });
  if (!response.ok) {
    throw new Error(`Failed to start guest session: ${response.status}`);
  }
  return response.json();
}

export function getFixtures(params?: { competitionId?: number; startEpochDay?: number }): Promise<Fixture[]> {
  return getJson<Fixture[]>("/api/fixtures", params);
}

export function getOddsSnapshot(fixtureId: number, asOf?: number): Promise<OddsSnapshot[]> {
  return getJson<OddsSnapshot[]>(`/api/odds/${fixtureId}`, { asOf });
}

export function getScoresSnapshot(fixtureId: number): Promise<ScoreEvent[]> {
  return getJson<ScoreEvent[]>(`/api/scores/${fixtureId}`);
}

// Opens an EventSource against our local proxy's live odds stream. Returns
// the EventSource so the caller can close it (e.g. on unmount / screen change).
export function subscribeToOddsStream(onMessage: (raw: string) => void, onError?: (err: Event) => void): EventSource {
  const source = new EventSource(`${API_BASE_URL}/api/odds/stream`);
  source.onmessage = (event) => onMessage(event.data);
  if (onError) source.onerror = onError;
  return source;
}

// Same idea, but for the scores/goals feed — this is where actual match
// events (goals, cards, period changes) show up, not the odds feed.
export function subscribeToScoresStream(onMessage: (raw: string) => void, onError?: (err: Event) => void): EventSource {
  const source = new EventSource(`${API_BASE_URL}/api/scores/stream`);
  source.onmessage = (event) => onMessage(event.data);
  if (onError) source.onerror = onError;
  return source;
}
