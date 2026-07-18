
"use client";

import { useEffect, useMemo, useState } from "react";

type Screen = "landing" | "matches" | "rooms" | "lobby" | "live" | "collection" | "summary";
type ProphecyType = "Goal" | "Penalty" | "VAR overturn" | "Red card";
type ReactionKey = "shock" | "love" | "fire" | "heartbreak" | "robbed" | "called";

const reactionOptions = [
  { key: "shock", emoji: "😱", label: "No way" },
  { key: "love", emoji: "❤️", label: "Love it" },
  { key: "fire", emoji: "🔥", label: "Incredible" },
  { key: "heartbreak", emoji: "😭", label: "Heartbroken" },
  { key: "robbed", emoji: "😡", label: "Robbed" },
  { key: "called", emoji: "🧠", label: "Called it" },
] as const;

const initialTimeline = [
  { minute: "77′", icon: "🎯", title: "Shot on target", detail: "France", tone: "neutral" },
  { minute: "76′", icon: "🟨", title: "Yellow card", detail: "Argentina", tone: "warning" },
  { minute: "74′", icon: "⚡", title: "Momentum shift", detail: "France pushing forward", tone: "purple" },
  { minute: "72′", icon: "🥅", title: "Big chance", detail: "Argentina", tone: "green" },
];

const rooms = [
  { name: "Messi Magic", members: 12, side: "Argentina supporters", badge: "🇦🇷", hot: true },
  { name: "Les Bleus Live", members: 8, side: "France supporters", badge: "🇫🇷", hot: false },
  { name: "Neutral Zone", members: 20, side: "Mixed supporters", badge: "🌍", hot: true },
];

export default function Home() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [walletConnected, setWalletConnected] = useState(false);
  const [roomName, setRoomName] = useState("Messi Magic");
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [prophecyOpen, setProphecyOpen] = useState(false);
  const [activeProphecy, setActiveProphecy] = useState<{
    type: ProphecyType;
    secondsLeft: number;
  } | null>(null);
  const [prophecyResultOpen, setProphecyResultOpen] = useState(false);
  const [varOpen, setVarOpen] = useState(false);
  const [varVote, setVarVote] = useState<"Penalty" | "No penalty" | null>(null);
  const [varSettled, setVarSettled] = useState(false);
  const [timeline, setTimeline] = useState(initialTimeline);
  const [score, setScore] = useState("2 — 1");
  const [minute, setMinute] = useState("79:32");
  const [reactions, setReactions] = useState<Record<ReactionKey, number>>({
    shock: 166,
    love: 98,
    fire: 64,
    heartbreak: 24,
    robbed: 11,
    called: 7,
  });
  const [selectedReaction, setSelectedReaction] = useState<ReactionKey | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [collectionCount, setCollectionCount] = useState(3);

  const route = (next: Screen) => {
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  };

  const connectWallet = () => {
    setWalletConnected(true);
    notify("Wallet connected in demo mode");
  };

  useEffect(() => {
    if (!activeProphecy) return;

    if (activeProphecy.secondsLeft <= 0) {
      setActiveProphecy(null);
      notify("Your prophecy expired. Try again.");
      return;
    }

    const timer = window.setTimeout(() => {
      setActiveProphecy((current) =>
        current ? { ...current, secondsLeft: current.secondsLeft - 1 } : null
      );
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [activeProphecy]);

  const prophecyProgress = useMemo(() => {
    if (!activeProphecy) return 0;
    return Math.max(0, Math.round((activeProphecy.secondsLeft / 60) * 100));
  }, [activeProphecy]);

  const submitProphecy = (type: ProphecyType) => {
    setActiveProphecy({ type, secondsLeft: 60 });
    setProphecyOpen(false);
    setTimeline((items) => [
      {
        minute: "79′",
        icon: "🔒",
        title: "You made a sealed prophecy",
        detail: "Recorded at 79:14",
        tone: "yellow",
      },
      ...items,
    ]);
    notify("Prophecy sealed and proof recorded");
  };

  const triggerGoal = () => {
    setScore("3 — 1");
    setMinute("80:05");
    setTimeline((items) => [
      {
        minute: "80′",
        icon: "⚽",
        title: "GOAL — Argentina",
        detail: "TxLINE event received",
        tone: "green",
      },
      ...items,
    ]);

    if (activeProphecy?.type === "Goal") {
      setActiveProphecy(null);
      setCollectionCount((count) => count + 1);
      window.setTimeout(() => setProphecyResultOpen(true), 400);
    } else {
      notify("Goal received from demo replay");
    }
  };

  const addReaction = (key: ReactionKey) => {
    if (selectedReaction) return;
    setSelectedReaction(key);
    setReactions((current) => ({ ...current, [key]: current[key] + 1 }));
    notify("Reaction added");
  };

  const submitVarVote = (vote: "Penalty" | "No penalty") => {
    setVarVote(vote);
    window.setTimeout(() => setVarSettled(true), 1200);
  };

  const closeVar = () => {
    setVarOpen(false);
    setVarVote(null);
    setVarSettled(false);
  };

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <button className="brand" onClick={() => route("landing")} aria-label="Oracle Room home">
          <span className="brand-mark">O</span>
          <span>
            <strong>Oracle Room</strong>
            <small>Call it. Prove it. Own it.</small>
          </span>
        </button>

        <div className="top-actions">
          {screen !== "landing" && (
            <button className="ghost-button desktop-only" onClick={() => route("matches")}>
              Matches
            </button>
          )}
          <button
            className={walletConnected ? "wallet-button connected" : "wallet-button"}
            onClick={connectWallet}
          >
            <span>{walletConnected ? "●" : "◈"}</span>
            {walletConnected ? "7A3k...91Fq" : "Connect Solana"}
          </button>
        </div>
      </header>

      {screen === "landing" && (
        <section className="landing-page">
          <div className="hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">LIVE WORLD CUP WATCH PARTY</span>
              <h1>
                Don’t just watch it.
                <span> Call it before it happens.</span>
              </h1>
              <p>
                Join a live room, make a sealed football prophecy, and let real TxLINE events
                prove whether you truly called the moment.
              </p>

              <div className="hero-actions">
                <button
                  className="primary-button"
                  onClick={() => {
                    connectWallet();
                    route("matches");
                  }}
                >
                  Enter demo match <span>→</span>
                </button>
                <button className="secondary-button" onClick={() => route("matches")}>
                  Explore rooms
                </button>
              </div>

              <div className="trust-row">
                <span>⚡ TxLINE live data</span>
                <span>◈ Solana proof</span>
                <span>👥 Built for fans</span>
              </div>
            </div>

            <div className="hero-phone-wrap">
              <div className="hero-glow" />
              <div className="phone-frame">
                <div className="phone-notch" />
                <div className="phone-screen">
                  <div className="mini-match-head">
                    <span>🇦🇷 Argentina</span>
                    <strong>2 — 1</strong>
                    <span>France 🇫🇷</span>
                  </div>
                  <div className="live-pill">● LIVE · 79:32</div>
                  <div className="mini-pulse">
                    <span>Match pulse</span>
                    <strong>🔥 Electric</strong>
                  </div>
                  <div className="mini-call-card">
                    <small>FEEL A MOMENT COMING?</small>
                    <button onClick={() => route("live")}>I FEEL IT ⚡</button>
                    <p>Tap before it happens. We’ll prove the rest.</p>
                  </div>
                  <div className="mini-feed">
                    <div><span>🔒</span><p><strong>Tobi made a prophecy</strong><small>Sealed at 79:14</small></p></div>
                    <div><span>🎯</span><p><strong>Shot on target</strong><small>France · 77′</small></p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section className="feature-strip">
            <article>
              <span className="feature-icon purple">⚡</span>
              <h3>Make the call</h3>
              <p>Tap once when your gut says a major football moment is coming.</p>
            </article>
            <article>
              <span className="feature-icon green">⚖️</span>
              <h3>Enter VAR Court</h3>
              <p>Vote with the room before the official decision is revealed.</p>
            </article>
            <article>
              <span className="feature-icon yellow">★</span>
              <h3>Own the proof</h3>
              <p>Successful calls become rarity-graded keepsakes anchored to Solana.</p>
            </article>
          </section>
        </section>
      )}

      {screen === "matches" && (
        <section className="page-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">WORLD CUP</span>
              <h2>Choose your match</h2>
              <p>Join the live conversation or replay a TxLINE match for the demo.</p>
            </div>
            <div className="status-chip">● Replay data ready</div>
          </div>

          <div className="match-grid">
            <article className="match-card featured">
              <div className="match-card-top">
                <span className="live-pill">● LIVE DEMO</span>
                <span>World Cup Final</span>
              </div>
              <div className="teams">
                <div><span className="flag">🇦🇷</span><strong>Argentina</strong></div>
                <div className="score-block"><strong>2 — 1</strong><small>79:32</small></div>
                <div><span className="flag">🇫🇷</span><strong>France</strong></div>
              </div>
              <div className="match-meta">
                <span>🔥 Electric</span>
                <span>3 rooms</span>
                <span>40 watching</span>
              </div>
              <button className="primary-button full" onClick={() => route("rooms")}>
                Join match
              </button>
            </article>

            <article className="match-card">
              <div className="match-card-top">
                <span className="replay-pill">HISTORICAL REPLAY</span>
                <span>Demo-ready</span>
              </div>
              <div className="teams">
                <div><span className="flag">🇧🇷</span><strong>Brazil</strong></div>
                <div className="score-block"><strong>1 — 2</strong><small>Finished</small></div>
                <div><span className="flag">🇫🇷</span><strong>France</strong></div>
              </div>
              <div className="match-meta">
                <span>▶ 10× replay</span>
                <span>VAR included</span>
              </div>
              <button className="secondary-button full" onClick={() => route("rooms")}>
                Open replay
              </button>
            </article>
          </div>
        </section>
      )}

      {screen === "rooms" && (
        <section className="page-section narrow">
          <div className="section-heading">
            <div>
              <span className="eyebrow">ARGENTINA VS FRANCE</span>
              <h2>Choose a room</h2>
              <p>Join supporters, neutrals, or create a private room for friends.</p>
            </div>
            <button className="primary-button" onClick={() => setCreateRoomOpen(true)}>
              + Create room
            </button>
          </div>

          <div className="room-list">
            {rooms.map((room) => (
              <article className="room-card" key={room.name}>
                <div className="room-main">
                  <span className="room-badge">{room.badge}</span>
                  <div>
                    <div className="room-title-row">
                      <h3>{room.name}</h3>
                      {room.hot && <span className="hot-chip">HOT</span>}
                    </div>
                    <p>{room.side}</p>
                  </div>
                </div>
                <div className="room-side">
                  <span>👥 {room.members} watching</span>
                  <button
                    className="join-button"
                    onClick={() => {
                      setRoomName(room.name);
                      route("lobby");
                    }}
                  >
                    Join
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="invite-card">
            <div>
              <span className="feature-icon purple">🔗</span>
              <div>
                <h3>Have an invite code?</h3>
                <p>Enter a private room shared by your friends.</p>
              </div>
            </div>
            <div className="invite-form">
              <input placeholder="Enter code" />
              <button className="secondary-button">Join</button>
            </div>
          </div>
        </section>
      )}

      {screen === "lobby" && (
        <section className="page-section lobby-page">
          <div className="lobby-card">
            <div className="lobby-banner">
              <span className="eyebrow">ROOM LOBBY</span>
              <h2>{roomName}</h2>
              <p>Argentina vs France · World Cup Final</p>
            </div>

            <div className="lobby-body">
              <div className="member-stack">
                {["AO", "TB", "KM", "PS", "JL"].map((name, index) => (
                  <span key={name} style={{ zIndex: 10 - index }}>{name}</span>
                ))}
                <small>+7</small>
              </div>
              <p><strong>12 people</strong> are ready for the match.</p>

              <div className="confidence-card">
                <div className="confidence-head">
                  <span>ROOM PREDICTION</span>
                  <strong>Who scores next?</strong>
                </div>
                <div className="bar-row">
                  <div><span>🇦🇷 Argentina</span><strong>72%</strong></div>
                  <div className="progress-track"><span style={{ width: "72%" }} /></div>
                </div>
                <div className="bar-row france">
                  <div><span>🇫🇷 France</span><strong>28%</strong></div>
                  <div className="progress-track"><span style={{ width: "28%" }} /></div>
                </div>
              </div>

              <div className="lobby-actions">
                <button className="secondary-button" onClick={() => notify("Invite link copied")}>
                  Copy invite link
                </button>
                <button className="primary-button" onClick={() => route("live")}>
                  Start watching <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {screen === "live" && (
        <section className="live-layout">
          <aside className="live-sidebar">
            <button className="back-link" onClick={() => route("rooms")}>← Back to rooms</button>
            <div className="side-room-card">
              <span className="eyebrow">YOU’RE IN</span>
              <h3>{roomName}</h3>
              <p>12 watching now</p>
            </div>

            <nav className="side-nav">
              <button className="active">◉ Live room</button>
              <button onClick={() => route("collection")}>★ My prophecies</button>
              <button>♛ Rankings</button>
              <button onClick={() => route("summary")}>▣ Match summary</button>
            </nav>

            <div className="demo-panel">
              <span className="eyebrow">DEMO CONTROLS</span>
              <p>Use these while recording your video.</p>
              <button onClick={triggerGoal}>Trigger goal event</button>
              <button onClick={() => setVarOpen(true)}>Trigger VAR review</button>
              <button onClick={() => route("summary")}>Jump to full time</button>
            </div>
          </aside>

          <div className="live-main">
            <div className="match-header-card">
              <div className="match-head-top">
                <div>
                  <span className="live-pill">● LIVE REPLAY</span>
                  <small>World Cup Final</small>
                </div>
                <div className="room-watchers">👥 12 in room</div>
              </div>
              <div className="scoreboard">
                <div><span className="flag xl">🇦🇷</span><strong>Argentina</strong></div>
                <div className="score-centre"><strong>{score}</strong><span>{minute}</span></div>
                <div><span className="flag xl">🇫🇷</span><strong>France</strong></div>
              </div>
              <div className="pulse-row">
                <div><span>Match pulse</span><strong>🔥 Electric</strong></div>
                <div className="pulse-bars">
                  {[1,2,3,4,5,6,7].map((bar) => <span key={bar} style={{ height: `${8 + bar * 4}px` }} />)}
                </div>
              </div>
            </div>

            <div className="call-panel">
              <div>
                <span className="eyebrow">FEEL A MOMENT COMING?</span>
                <h2>Call it before it happens.</h2>
                <p>Your prediction stays sealed until the event or timer settles it.</p>
              </div>

              {!activeProphecy ? (
                <button className="feel-button" onClick={() => setProphecyOpen(true)}>
                  <span>I FEEL IT</span>
                  <strong>⚡</strong>
                </button>
              ) : (
                <div className="active-prophecy">
                  <div className="countdown-ring" style={{ "--progress": `${prophecyProgress}%` } as React.CSSProperties}>
                    <span>{activeProphecy.secondsLeft}</span>
                  </div>
                  <div>
                    <small>YOUR SEALED PROPHECY</small>
                    <strong>{activeProphecy.type}</strong>
                    <span>Proof recorded · waiting for TxLINE</span>
                  </div>
                </div>
              )}
            </div>

            <div className="live-content-grid">
              <section className="timeline-card">
                <div className="card-title-row">
                  <div><span className="eyebrow">LIVE FEED</span><h3>Match timeline</h3></div>
                  <span className="status-chip">● Synced</span>
                </div>

                <div className="timeline-list">
                  {timeline.map((event, index) => (
                    <div className={`timeline-item ${event.tone}`} key={`${event.minute}-${event.title}-${index}`}>
                      <span className="timeline-minute">{event.minute}</span>
                      <span className="timeline-icon">{event.icon}</span>
                      <div><strong>{event.title}</strong><small>{event.detail}</small></div>
                    </div>
                  ))}
                </div>
              </section>

              <aside className="room-panel">
                <div className="card-title-row">
                  <div><span className="eyebrow">ROOM ENERGY</span><h3>React now</h3></div>
                  <small>5-second windows</small>
                </div>

                <div className="reaction-grid">
                  {reactionOptions.map((reaction) => (
                    <button
                      key={reaction.key}
                      className={selectedReaction === reaction.key ? "reaction active" : "reaction"}
                      onClick={() => addReaction(reaction.key)}
                    >
                      <span>{reaction.emoji}</span>
                      <strong>{reactions[reaction.key]}</strong>
                      <small>{reaction.label}</small>
                    </button>
                  ))}
                </div>

                <div className="leader-mini">
                  <div className="leader-head"><span>ROOM ORACLES</span><button>View all</button></div>
                  {[
                    ["1", "Alex", "840"],
                    ["2", "Priya", "760"],
                    ["3", "Tobi", "690"],
                  ].map(([rank, name, score]) => (
                    <div className="leader-row" key={name}>
                      <span className="rank">{rank}</span>
                      <span className="avatar">{name.slice(0, 1)}</span>
                      <strong>{name}</strong>
                      <small>{score} pts</small>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </section>
      )}

      {screen === "collection" && (
        <section className="page-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">YOUR COLLECTION</span>
              <h2>Prophecies you proved</h2>
              <p>Every successful call is tied to the match moment and its rarity.</p>
            </div>
            <button className="secondary-button" onClick={() => route("live")}>Back to match</button>
          </div>

          <div className="collection-grid">
            {[
              { title: "The 89th-minute call", match: "France vs Brazil", chance: "6%", rarity: "Legendary", icon: "⚡" },
              { title: "VAR overturn", match: "Argentina vs Spain", chance: "14%", rarity: "Epic", icon: "⚖️" },
              { title: "Penalty incoming", match: "England vs Portugal", chance: "21%", rarity: "Rare", icon: "🎯" },
              ...(collectionCount > 3 ? [{ title: "Final goal prophecy", match: "Argentina vs France", chance: "8%", rarity: "Legendary", icon: "🏆" }] : []),
            ].map((card) => (
              <article className={`prophecy-card ${card.rarity.toLowerCase()}`} key={`${card.title}-${card.match}`}>
                <div className="prophecy-card-top"><span>{card.icon}</span><small>{card.rarity}</small></div>
                <div>
                  <h3>{card.title}</h3>
                  <p>{card.match}</p>
                </div>
                <div className="prophecy-stats"><span>Market chance</span><strong>{card.chance}</strong></div>
                <button>View proof ↗</button>
              </article>
            ))}
          </div>
        </section>
      )}

      {screen === "summary" && (
        <section className="page-section summary-page">
          <div className="summary-hero">
            <span className="eyebrow">FULL TIME</span>
            <div className="summary-score">
              <div><span>🇦🇷</span><strong>Argentina</strong></div>
              <h2>3 — 2</h2>
              <div><span>🇫🇷</span><strong>France</strong></div>
            </div>
            <p>{roomName} · What a night.</p>
          </div>

          <div className="summary-grid">
            <article className="summary-stat"><span>👥</span><strong>12</strong><small>Fans joined</small></article>
            <article className="summary-stat"><span>🔒</span><strong>23</strong><small>Prophecies</small></article>
            <article className="summary-stat"><span>⚡</span><strong>4</strong><small>Successful calls</small></article>
            <article className="summary-stat"><span>⚖️</span><strong>3</strong><small>VAR votes</small></article>
          </div>

          <div className="awards-card">
            <div className="card-title-row">
              <div><span className="eyebrow">ROOM AWARDS</span><h3>Your match-night legends</h3></div>
              <button className="secondary-button" onClick={() => notify("Memory card generated")}>Share card</button>
            </div>
            <div className="award-grid">
              {[
                ["👑", "Room Oracle", "Alex"],
                ["⚡", "Most Hyped", "Priya"],
                ["💀", "Biggest Jinx", "Sam"],
                ["⚖️", "VAR Expert", "Tobi"],
              ].map(([icon, title, name]) => (
                <div className="award" key={title}><span>{icon}</span><div><small>{title}</small><strong>{name}</strong></div></div>
              ))}
            </div>
          </div>

          <div className="summary-actions">
            <button className="secondary-button" onClick={() => route("collection")}>View prophecies</button>
            <button className="primary-button" onClick={() => route("matches")}>Choose next match</button>
          </div>
        </section>
      )}

      {createRoomOpen && (
        <div className="modal-backdrop" onClick={() => setCreateRoomOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setCreateRoomOpen(false)}>×</button>
            <span className="eyebrow">NEW WATCH PARTY</span>
            <h2>Create your room</h2>
            <label>
              Room name
              <input defaultValue="Final Night Crew" />
            </label>
            <label>
              Who are you supporting?
              <select defaultValue="Argentina">
                <option>Argentina</option>
                <option>France</option>
                <option>Neutral</option>
              </select>
            </label>
            <div className="toggle-row">
              <div><strong>Private room</strong><small>Only people with your link can join.</small></div>
              <input type="checkbox" defaultChecked />
            </div>
            <button
              className="primary-button full"
              onClick={() => {
                setRoomName("Final Night Crew");
                setCreateRoomOpen(false);
                route("lobby");
              }}
            >
              Create room
            </button>
          </div>
        </div>
      )}

      {prophecyOpen && (
        <div className="modal-backdrop" onClick={() => setProphecyOpen(false)}>
          <div className="modal-card prophecy-modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setProphecyOpen(false)}>×</button>
            <span className="eyebrow">MAKE A SEALED CALL</span>
            <h2>What do you feel coming?</h2>
            <p>Your choice stays private until the window settles.</p>
            <div className="prediction-options">
              {[
                ["⚽", "Goal", "Next 60 seconds"],
                ["🎯", "Penalty", "Before the next stoppage"],
                ["⚖️", "VAR overturn", "Next review changes the call"],
                ["🟥", "Red card", "Next 3 minutes"],
              ].map(([icon, title, helper]) => (
                <button key={title} onClick={() => submitProphecy(title as ProphecyType)}>
                  <span>{icon}</span>
                  <div><strong>{title}</strong><small>{helper}</small></div>
                  <b>→</b>
                </button>
              ))}
            </div>
            <div className="proof-note">◈ A timestamped proof will be recorded on Solana devnet.</div>
          </div>
        </div>
      )}

      {prophecyResultOpen && (
        <div className="modal-backdrop celebration">
          <div className="result-card">
            <div className="confetti">✦ ✧ ★ ✦ ✧ ★</div>
            <span className="result-icon">🏆</span>
            <span className="eyebrow">PROPHECY PROVED</span>
            <h2>You called it!</h2>
            <p>You predicted the goal <strong>41 seconds</strong> before it happened.</p>
            <div className="rarity-box">
              <small>MARKET CHANCE WHEN CALLED</small>
              <strong>8%</strong>
              <span>LEGENDARY</span>
            </div>
            <div className="result-actions">
              <button className="secondary-button" onClick={() => setProphecyResultOpen(false)}>Close</button>
              <button className="primary-button" onClick={() => { setProphecyResultOpen(false); route("collection"); }}>
                View collection
              </button>
            </div>
          </div>
        </div>
      )}

      {varOpen && (
        <div className="modal-backdrop var-backdrop">
          <div className="var-card">
            <div className="var-top">
              <span className="gavel">⚖️</span>
              <span className="eyebrow">VAR COURTROOM</span>
              <h2>Possible penalty</h2>
              <p>The referee is reviewing contact inside the box.</p>
            </div>

            {!varVote ? (
              <div className="var-options">
                <button className="penalty" onClick={() => submitVarVote("Penalty")}>
                  <span>✓</span><strong>PENALTY</strong><small>68% of room</small>
                </button>
                <button className="no-penalty" onClick={() => submitVarVote("No penalty")}>
                  <span>×</span><strong>NO PENALTY</strong><small>32% of room</small>
                </button>
              </div>
            ) : !varSettled ? (
              <div className="decision-pending">
                <div className="loader" />
                <h3>Your vote is locked</h3>
                <p>Waiting for the official TxLINE decision…</p>
              </div>
            ) : (
              <div className="decision-result">
                <span>✓</span>
                <h3>Penalty awarded</h3>
                <p>{varVote === "Penalty" ? "You called it correctly. +120 points" : "The room got you this time."}</p>
                <button className="primary-button full" onClick={closeVar}>Back to match</button>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
