// nucorns — "Write a story": WYSIWYG editor with safety checks on media + publish.
const { useState, useRef } = React;

const WR_CATS = ["Field Notes", "Gear", "Essay", "Tutorial", "Personal"];
const WR_COVERS = [
  ["#FFCB7A", "#FF7A1A", "#1FA8F0"], ["#6FD0FF", "#1B8BE0", "#7A5AF0"],
  ["#9BE7C4", "#2BB673", "#1FA8F0"], ["#C9B6FF", "#7A5AF0", "#F0568F"],
  ["#FFD27A", "#FF8A3D", "#F0568F"],
];

function autogrow(el) { if (!el) return; el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }

function App() {
  const [cat, setCat] = useState("Field Notes");
  const [title, setTitle] = useState("");
  const [dek, setDek] = useState("");
  const [body, setBody] = useState("");
  const [coverGrad, setCoverGrad] = useState(WR_COVERS[0]);
  const [coverSrc, setCoverSrc] = useState(null);
  const [photos, setPhotos] = useState([]); // {src}
  const [status, setStatus] = useState("idle"); // idle|checking|blocked
  const [alert, setAlert] = useState(null); // {kind, title, msg, cats}
  const coverRef = useRef(null);
  const photoRef = useRef(null);

  async function onCover(file) {
    if (!file) return;
    setAlert(null);
    const r = await moderateImageFile(file);
    if (r.status === "blocked") { setAlert({ kind: "photo", title: "Cover can't be used", msg: r.reason }); return; }
    setCoverSrc(r.dataUrl);
  }
  async function onPhotos(files) {
    setAlert(null);
    for (const f of Array.from(files)) {
      const r = await moderateImageFile(f);
      if (r.status === "blocked") { setAlert({ kind: "photo", title: "A photo was blocked", msg: r.reason }); continue; }
      setPhotos((p) => [...p, { src: r.dataUrl, video: r.video }]);
    }
  }
  function removePhoto(i) { setPhotos((p) => p.filter((_, idx) => idx !== i)); }

  const canPublish = title.trim().length >= 4 && body.trim().length >= 12;

  async function publish() {
    if (!canPublish || status === "checking") return;
    setAlert(null); setStatus("checking");
    const combined = [title, dek, body].filter(Boolean).join("\n\n");
    const res = await moderateText(combined);
    if (res.status === "blocked") {
      setStatus("blocked");
      setAlert({ kind: "text", title: "This needs an edit before it goes live", msg: res.reason, cats: res.categories });
      return;
    }
    const words = body.trim().split(/\s+/).length;
    const story = {
      id: "s" + Date.now(),
      mine: true, author: "you",
      category: cat,
      title: title.trim(),
      dek: dek.trim() || body.trim().slice(0, 110),
      body: body.trim().split(/\n{2,}/).map((s) => s.trim()).filter(Boolean),
      cover: coverSrc ? { src: coverSrc } : coverGrad,
      media: photos,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      readTime: Math.max(1, Math.round(words / 200)) + " min",
      hearts: 0, comments: 0, shares: 0,
      unverified: res.unverified,
    };
    nuSaveStory(story);
    window.location.href = "nucorns — Profile.html";
  }

  const coverStyle = coverSrc
    ? { background: `center/cover url(${coverSrc})` }
    : { background: `linear-gradient(120deg, ${coverGrad[0]}, ${coverGrad[1]} 55%, ${coverGrad[2]})` };

  return (
    <div className="nu-root" data-direction="playful" data-density="cozy">
      <header className="nu-nav">
        <div className="nu-nav-inner">
          <a className="nu-wordmark" href="nucorns — Profile.html"><img className="nu-logo-img" src="assets/nucorns-mark-circle.png" alt="" />nu<span>corns</span></a>
          <div className="wr-navmid">New story</div>
          <div className="nu-nav-right">
            <a className="nu-btn-ghost" href="nucorns — Profile.html">Cancel</a>
            <button className="nu-btn-post" disabled={!canPublish || status === "checking"} onClick={publish}>
              {status === "checking" ? <><span className="wr-spin" />Checking…</> : <><Icon name="sparkle" size={16} />Publish</>}
            </button>
          </div>
        </div>
      </header>

      <main className="wr-main">
        {alert && (
          <div className={"wr-alert wr-alert-" + alert.kind}>
            <div className="wr-alert-icon"><Icon name="close" size={18} /></div>
            <div>
              <div className="wr-alert-title">{alert.title}</div>
              <div className="wr-alert-msg">{alert.msg}</div>
              {alert.cats && alert.cats.length > 0 && <div className="wr-alert-cats">{alert.cats.map((c) => <span key={c}>{c}</span>)}</div>}
            </div>
            <button className="wr-alert-x" onClick={() => setAlert(null)}><Icon name="close" size={15} /></button>
          </div>
        )}

        {/* cover */}
        <div className="wr-cover" style={coverStyle}>
          {!coverSrc && <span className="nu-ph-stripes" />}
          <div className="wr-cover-tools">
            <button className="wr-cv-btn" onClick={() => coverRef.current.click()}><Icon name="photo" size={16} />{coverSrc ? "Replace" : "Upload cover"}</button>
            {coverSrc && <button className="wr-cv-btn" onClick={() => setCoverSrc(null)}><Icon name="close" size={16} />Remove</button>}
            {!coverSrc && (
              <div className="wr-cv-swatches">
                {WR_COVERS.map((g, i) => (
                  <button key={i} className={"wr-cv-sw" + (coverGrad === g ? " is-on" : "")}
                    style={{ background: `linear-gradient(120deg, ${g[0]}, ${g[1]} 55%, ${g[2]})` }}
                    onClick={() => setCoverGrad(g)} />
                ))}
              </div>
            )}
            <input ref={coverRef} type="file" accept="image/*" hidden onChange={(e) => { onCover(e.target.files[0]); e.target.value = ""; }} />
          </div>
        </div>

        {/* category */}
        <div className="wr-cats">
          {WR_CATS.map((c) => (
            <button key={c} className={"wr-cat" + (cat === c ? " is-on" : "")} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>

        {/* title + dek + body */}
        <textarea className="wr-title" rows={1} placeholder="Your story title…" value={title}
          onChange={(e) => { setTitle(e.target.value); autogrow(e.target); }} />
        <textarea className="wr-dek" rows={1} placeholder="Add a subtitle (optional)" value={dek}
          onChange={(e) => { setDek(e.target.value); autogrow(e.target); }} />
        <textarea className="wr-body" rows={6} placeholder="Tell your story. Leave a blank line between paragraphs." value={body}
          onChange={(e) => { setBody(e.target.value); autogrow(e.target); }} />

        {/* photos */}
        <div className="wr-gallery">
          {photos.map((p, i) => (
            <div className="wr-ph" key={i}>
              {p.video ? <video src={p.src} muted /> : <img src={p.src} alt="" />}
              <button className="nu-tray-x" onClick={() => removePhoto(i)}><Icon name="close" size={13} /></button>
            </div>
          ))}
          <button className="wr-addph" onClick={() => photoRef.current.click()}>
            <Icon name="photo" size={20} /><span>Add photos / video</span>
          </button>
          <input ref={photoRef} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => { onPhotos(e.target.files); e.target.value = ""; }} />
        </div>

        {/* guidelines footer */}
        <div className="wr-guide">
          <Icon name="heart" size={15} />
          <span>Before publishing, a quick safety check runs automatically. {""}
          <strong>No nudity, harassment, or hateful language</strong> — see <a href="#" onClick={(e) => e.preventDefault()}>community guidelines</a>.</span>
        </div>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
