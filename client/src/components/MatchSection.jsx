import { useEffect, useState } from "react";
import Icon from "./Icon";
import { Avatar } from "./Primitives";
import { api } from "../lib/api";

function MatchCard({ m, onWave }) {
  const [busy, setBusy] = useState(false);
  const [waved, setWaved] = useState(m.waved);
  const { user, shared, themeHits } = m;
  const why = shared.length
    ? "You both love " + shared.slice(0, 2).join(" & ").toLowerCase()
    : "Your stories share themes like " + themeHits.slice(0, 2).join(", ");

  async function wave() {
    if (waved || busy) return;
    setBusy(true);
    try { await onWave(user.handle); setWaved(true); } finally { setBusy(false); }
  }

  return (
    <div className={"mc" + (waved ? " is-waved" : "")}>
      <Avatar user={user} size={52} />
      <div className="mc-body">
        <div className="mc-name">{user.name} <span>@{user.handle}</span></div>
        <div className="mc-why"><Icon name="sparkle" size={13} />{why}</div>
        <div className="mc-tags">
          {shared.map((s) => <span key={s} className="mc-tag is-shared">{s}</span>)}
          {themeHits.slice(0, Math.max(0, 3 - shared.length)).map((th) => <span key={th} className="mc-tag">{th}</span>)}
        </div>
        {waved && <div className="mc-intro">Soft intro sent ✦ <em>"Hey {user.name.split(" ")[0]} — your work caught my eye, thought we might vibe. No pressure!"</em></div>}
      </div>
      <button className={"mc-wave" + (waved ? " is-on" : "")} onClick={wave} disabled={waved || busy}>
        {waved ? <><Icon name="check" size={15} />Waved</> : <>👋 Wave</>}
      </button>
    </div>
  );
}

export default function MatchSection() {
  const [matches, setMatches] = useState(null);

  useEffect(() => {
    let live = true;
    api.get("/matches").then((d) => { if (live) setMatches(d.matches); }).catch(() => { if (live) setMatches([]); });
    return () => { live = false; };
  }, []);

  async function wave(handle) {
    await api.post("/matches/wave", { handle });
  }

  if (!matches || !matches.length) return null;
  return (
    <section className="mx">
      <div className="mx-head">
        <h3 className="mx-title">Creators you might vibe with</h3>
        <span className="mx-sub">Matched on your interests & the themes in your writing</span>
      </div>
      <div className="mx-list">
        {matches.map((m) => <MatchCard key={m.user.handle} m={m} onWave={wave} />)}
      </div>
      <p className="mx-note"><Icon name="heart" size={13} />A wave is a soft, opt-in hello — they only see it if they wave back.</p>
    </section>
  );
}
