// nucorns — main app: post + live conversation with media.
const { useState, useMemo } = React;

let _uid = 100;
const uid = () => "u" + (++_uid);

function clone(arr) { return JSON.parse(JSON.stringify(arr)); }

/* recursively toggle a like by id */
function toggleLikeIn(list, id) {
  return list.map((c) => {
    if (c.id === id) {
      return { ...c, liked: !c.liked, likes: c.likes + (c.liked ? -1 : 1) };
    }
    if (c.replies && c.replies.length) return { ...c, replies: toggleLikeIn(c.replies, id) };
    return c;
  });
}
function addReplyIn(list, parentId, reply) {
  return list.map((c) => {
    if (c.id === parentId) return { ...c, replies: [...(c.replies || []), reply] };
    if (c.replies && c.replies.length) return { ...c, replies: addReplyIn(c.replies, parentId, reply) };
    return c;
  });
}
function countAll(list) {
  return list.reduce((n, c) => n + 1 + (c.replies ? countAll(c.replies) : 0), 0);
}

/* ---------- Post article ---------- */
function Article({ showHero, liked, onLike }) {
  const p = NU_POST;
  const a = NU_AVATARS[p.author];
  const [following, setFollowing] = useState(false);
  return (
    <article className="nu-article">
      <div className="nu-eyebrow"><span className="nu-cat">{p.category}</span><span className="nu-readtime">{p.readTime}</span></div>
      <h1 className="nu-title">{p.title}</h1>
      <p className="nu-dek">{p.dek}</p>
      <div className="nu-byline">
        <Avatar who={p.author} size={48} ring />
        <div className="nu-byline-id">
          <span className="nu-name">{a.name}</span>
          <span className="nu-byline-sub">@{a.handle} · {p.date}</span>
        </div>
        <button className={"nu-follow" + (following ? " is-following" : "")} onClick={() => setFollowing((v) => !v)}>
          {following ? <><Icon name="check" size={15} />Following</> : "Follow"}
        </button>
      </div>
      {showHero && (
        <div className="nu-hero">
          <div className="nu-ph" style={{ background: `linear-gradient(120deg, ${p.hero[0]}, ${p.hero[1]} 55%, ${p.hero[2]})` }}>
            <span className="nu-ph-stripes" />
            <span className="nu-ph-label nu-hero-label"><Icon name="photo" size={15} />hero — golden-hour-essay.jpg</span>
          </div>
        </div>
      )}
      <div className="nu-prose">
        {p.body.map((para, i) => <p key={i}>{para}</p>)}
      </div>
      <div className="nu-postbar">
        <Reaction big seed={{ up: p.stats.hearts, mixed: Math.round(p.stats.hearts * 0.05), down: Math.round(p.stats.hearts * 0.03) }} />
        <button className="nu-pill"><Icon name="reply" size={19} /><span>{nuFmt(p.stats.shares)}</span></button>
        <button className="nu-pill"><Icon name="share" size={18} /><span>Share</span></button>
        <button className="nu-pill nu-pill-bm"><Icon name="bookmark" size={18} /></button>
      </div>
    </article>
  );
}

/* ---------- Lightbox ---------- */
function Lightbox({ m, onClose }) {
  if (!m) return null;
  return (
    <div className="nu-lightbox" onClick={onClose}>
      <button className="nu-lb-close" onClick={onClose}><Icon name="close" size={22} /></button>
      <div className="nu-lb-inner" onClick={(e) => e.stopPropagation()}>
        {m.src
          ? <img src={m.src} alt={m.label || ""} />
          : <div className="nu-ph nu-lb-ph" style={{ background: `linear-gradient(135deg, ${m.grad[0]}, ${m.grad[1]})` }}><span className="nu-ph-stripes" /><span className="nu-ph-label"><Icon name="photo" size={15} />{m.label}</span></div>}
      </div>
    </div>
  );
}

/* ---------- App ---------- */
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [comments, setComments] = useState(() => clone(NU_COMMENTS));
  const [sort, setSort] = useState("top");
  const [postLiked, setPostLiked] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const total = useMemo(() => countAll(comments), [comments]);

  const ordered = useMemo(() => {
    const c = [...comments];
    if (sort === "top") c.sort((a, b) => (b.likes) - (a.likes));
    else c.sort((a, b) => (b._ts || 0) - (a._ts || 0));
    return c;
  }, [comments, sort]);

  function like(id) { setComments((cs) => toggleLikeIn(cs, id)); }

  function addComment(payload) {
    const c = { id: uid(), author: "you", time: "now", likes: 0, liked: false, body: payload.body, media: payload.media, replies: [], isNew: true, _ts: Date.now() };
    setComments((cs) => [c, ...cs]);
    setSort("new");
  }
  function addReply(parentId, payload) {
    const r = { id: uid(), author: "you", time: "now", likes: 0, liked: false, body: payload.body, media: payload.media, replies: [], isNew: true, _ts: Date.now() };
    setComments((cs) => addReplyIn(cs, parentId, r));
  }

  const rootStyle = {
    "--accent": t.lead === "orange" ? "var(--orange)" : "var(--sky)",
    "--accent-2": t.lead === "orange" ? "var(--sky)" : "var(--orange)",
    "--radius": t.roundness + "px",
    "--font": t.font === "Sora" ? "'Sora', sans-serif" : t.font === "Hanken" ? "'Hanken Grotesque', sans-serif" : "'Plus Jakarta Sans', sans-serif",
  };

  return (
    <div className="nu-root" data-direction={t.direction} data-density={t.density} style={rootStyle}>
      {/* top nav */}
      <header className="nu-nav">
        <div className="nu-nav-inner">
          <a className="nu-wordmark" href="#"><img className="nu-logo-img" src="assets/nucorns-mark-circle.png" alt="" />nu<span>corns</span></a>
          <div className="nu-search"><Icon name="search" size={18} /><input placeholder="Search creators & stories" /></div>
          <div className="nu-nav-right">
            <button className="nu-nav-write"><Icon name="sparkle" size={16} />Write</button>
            <Avatar who="you" size={36} />
          </div>
        </div>
      </header>

      <main className="nu-main">
        <Article showHero={t.showHero} liked={postLiked} onLike={() => setPostLiked((v) => !v)} />

        <div className="nu-adslot-wrap"><AdSlot slotId="convo" /></div>

        {/* conversation */}
        <section className="nu-convo">
          <div className="nu-convo-head">
            <h2 className="nu-convo-title">Conversation <span>{total}</span></h2>
            <div className="nu-sort">
              <button className={sort === "top" ? "is-on" : ""} onClick={() => setSort("top")}>Top</button>
              <button className={sort === "new" ? "is-on" : ""} onClick={() => setSort("new")}>Newest</button>
            </div>
          </div>

          <div className="nu-composer-wrap">
            <Composer who="you" onSubmit={addComment} />
          </div>

          <div className="nu-comment-list">
            {ordered.map((c) => (
              <Comment key={c.id} data={c} onLike={like} onReply={addReply} onOpenPhoto={setLightbox} />
            ))}
          </div>
        </section>
        <div className="nu-adslot-wrap"><AdSlot slotId="story" /></div>
        <footer className="nu-foot">made with <span className="nu-foot-mark">nucorns</span> · be kind in the comments ✦ · <a href="nucorns — Advertising.html">Advertise</a></footer>
      </main>

      <Lightbox m={lightbox} onClose={() => setLightbox(null)} />

      <TweaksPanel>
        <TweakSection label="Direction" />
        <TweakRadio label="Style" value={t.direction} options={["playful", "minimal", "bold"]} onChange={(v) => setTweak("direction", v)} />
        <TweakSection label="Color" />
        <TweakRadio label="Lead accent" value={t.lead} options={["sky", "orange"]} onChange={(v) => setTweak("lead", v)} />
        <TweakSection label="Shape & type" />
        <TweakSlider label="Roundness" value={t.roundness} min={4} max={26} step={1} unit="px" onChange={(v) => setTweak("roundness", v)} />
        <TweakSelect label="Font" value={t.font} options={["Jakarta", "Sora", "Hanken"]} onChange={(v) => setTweak("font", v)} />
        <TweakRadio label="Density" value={t.density} options={["cozy", "comfy"]} onChange={(v) => setTweak("density", v)} />
        <TweakToggle label="Show hero image" value={t.showHero} onChange={(v) => setTweak("showHero", v)} />
      </TweaksPanel>
    </div>
  );
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "direction": "playful",
  "lead": "sky",
  "roundness": 18,
  "font": "Jakarta",
  "density": "cozy",
  "showHero": true
}/*EDITMODE-END*/;

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
