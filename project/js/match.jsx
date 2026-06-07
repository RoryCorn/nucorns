// nucorns — "creators you might vibe with": match on shared interests + themes,
// then offer a low-pressure soft introduction (a wave).
const { useState } = React;

const NU_CREATORS = [
  { handle: "devinshoots", name: "Devin Park", grad: ["#6FD0FF", "#1B8BE0"],
    bio: "Street & night photography. Neon, rain, and long exposures.",
    interests: ["Photography", "Street", "Travel", "Analog"],
    themes: ["light", "photography", "street", "night", "film", "patience", "frame", "gear"] },
  { handle: "rinaroams", name: "Rina Solis", grad: ["#9BE7C4", "#2BB673"],
    bio: "Slow travel diaries and the art of waiting for a moment.",
    interests: ["Travel", "Photography", "Writing", "Coffee"],
    themes: ["travel", "slow", "moment", "patience", "light", "diary", "wait", "coffee"] },
  { handle: "theobuilds", name: "Theo B.", grad: ["#C9B6FF", "#7A5AF0"],
    bio: "Essays on craft, process, and quitting the algorithm.",
    interests: ["Writing", "Design", "Tech", "Books"],
    themes: ["essay", "process", "craft", "algorithm", "writing", "slow", "design", "making"] },
  { handle: "julesmari", name: "Jules Marigold", grad: ["#FF9EC4", "#F0568F"],
    bio: "Film photographer & darkroom printer. Grain over pixels.",
    interests: ["Photography", "Analog", "Illustration", "Music"],
    themes: ["film", "darkroom", "print", "grain", "analog", "photography", "frame"] },
  { handle: "novakwrites", name: "Noor Vélez", grad: ["#FFD27A", "#FF8A3D"],
    bio: "Music writing, late-night playlists, and field recordings.",
    interests: ["Music", "Writing", "Tech", "Coffee"],
    themes: ["music", "sound", "playlist", "writing", "record", "night", "coffee"] },
  { handle: "imakefilms", name: "Sam Adeyemi", grad: ["#7FE0D0", "#2BB6C2"],
    bio: "Short documentary films about ordinary, patient people.",
    interests: ["Filmmaking", "Photography", "Travel", "Books"],
    themes: ["film", "documentary", "patience", "people", "story", "ordinary", "travel"] },
];

const NU_STOP = new Set("the a an and or of to in on for with my our your this that you me it is are was were be been about into over only just here there their they them what when which who how why not can will".split(" "));

function nuTokens(str) {
  return (str || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
    .filter((w) => w.length > 3 && !NU_STOP.has(w));
}

function nuTopMatches(profile, stories, n = 3) {
  const myInterests = new Set((profile.interests || []).map((s) => s.toLowerCase()));
  const text = [profile.bio, ...(stories || []).flatMap((s) => [s.title, s.dek])].join(" ");
  const myWords = new Set(nuTokens(text));
  const me = profile.handle;
  const scored = NU_CREATORS.filter((c) => c.handle !== me).map((c) => {
    const shared = c.interests.filter((i) => myInterests.has(i.toLowerCase()));
    const themeHits = c.themes.filter((th) => myWords.has(th));
    const score = shared.length * 3 + themeHits.length;
    return { c, score, shared, themeHits };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
  return scored.slice(0, n);
}

function MatchCard({ m }) {
  const [waved, setWaved] = useState(false);
  const { c, shared, themeHits } = m;
  const why = shared.length
    ? "You both love " + shared.slice(0, 2).join(" & ").toLowerCase()
    : "Your stories share themes like " + themeHits.slice(0, 2).join(", ");
  return (
    <div className={"mc" + (waved ? " is-waved" : "")}>
      <Portrait grad={c.grad} name={c.name} size={52} />
      <div className="mc-body">
        <div className="mc-name">{c.name} <span>@{c.handle}</span></div>
        <div className="mc-why"><Icon name="sparkle" size={13} />{why}</div>
        <div className="mc-tags">
          {shared.map((s) => <span key={s} className="mc-tag is-shared">{s}</span>)}
          {themeHits.slice(0, 3 - shared.length > 0 ? 3 - shared.length : 0).map((th) => <span key={th} className="mc-tag">{th}</span>)}
        </div>
        {waved && <div className="mc-intro">Soft intro sent ✦ <em>"Hey {c.name.split(" ")[0]} — your work caught my eye, thought we might vibe. No pressure!"</em></div>}
      </div>
      <button className={"mc-wave" + (waved ? " is-on" : "")} onClick={() => setWaved(true)} disabled={waved}>
        {waved ? <><Icon name="check" size={15} />Waved</> : <>👋 Wave</>}
      </button>
    </div>
  );
}

function MatchSection({ profile, stories }) {
  const matches = nuTopMatches(profile, stories, 3);
  if (!matches.length) return null;
  return (
    <section className="mx">
      <div className="mx-head">
        <h3 className="mx-title">Creators you might vibe with</h3>
        <span className="mx-sub">Matched on your interests & the themes in your writing</span>
      </div>
      <div className="mx-list">
        {matches.map((m) => <MatchCard key={m.c.handle} m={m} />)}
      </div>
      <p className="mx-note"><Icon name="heart" size={13} />A wave is a soft, opt-in hello — they only see it if they wave back.</p>
    </section>
  );
}

Object.assign(window, { NU_CREATORS, nuTopMatches, MatchSection, MatchCard });
