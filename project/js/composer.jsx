// Composer: write a comment/reply, attach photos, videos, and link embeds.
const { useState, useRef } = React;

function Composer({ who = "you", compact = false, autoFocus = false, placeholder, onSubmit, onCancel }) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState([]); // {kind, src/url, label, title, site}
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkVal, setLinkVal] = useState("");
  const [err, setErr] = useState("");
  const [checking, setChecking] = useState(false);
  const photoRef = useRef(null);
  const videoRef = useRef(null);
  const taRef = useRef(null);

  React.useEffect(() => { if (autoFocus && taRef.current) taRef.current.focus(); }, [autoFocus]);

  async function addFiles(files, kind) {
    setErr("");
    for (const f of Array.from(files)) {
      const r = await moderateImageFile(f);
      if (r.status === "blocked") { setErr(r.reason); continue; }
      setAttachments((a) => [...a, { kind, src: r.dataUrl, label: f.name, video: r.video }]);
    }
  }

  function addLink() {
    let url = linkVal.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    let site = url;
    try { site = new URL(url).hostname.replace(/^www\./, ""); } catch (e) {}
    const title = site.split(".")[0].replace(/^\w/, (c) => c.toUpperCase()) + " — shared link";
    setAttachments((a) => [...a, { kind: "link", url, site, title }]);
    setLinkVal(""); setLinkOpen(false);
  }

  function removeAt(i) { setAttachments((a) => a.filter((_, idx) => idx !== i)); }

  const canPost = text.trim().length > 0 || attachments.length > 0;

  async function submit() {
    if (!canPost || checking) return;
    setErr(""); setChecking(true);
    const res = await moderateText(text);
    setChecking(false);
    if (res.status === "blocked") { setErr(res.reason); return; }
    onSubmit({ body: text.trim(), media: attachments });
    setText(""); setAttachments([]); setLinkOpen(false); setLinkVal("");
  }

  function autogrow(e) {
    const el = e.target; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 220) + "px";
  }

  return (
    <div className={"nu-composer" + (compact ? " is-compact" : "")}>
      <Avatar who={who} size={compact ? 36 : 44} />
      <div className="nu-composer-main">
        <textarea
          ref={taRef}
          className="nu-textarea"
          value={text}
          onChange={(e) => { setText(e.target.value); autogrow(e); }}
          placeholder={placeholder || "Add to the conversation…"}
          rows={1}
        />

        {/* attachment previews */}
        {attachments.length > 0 && (
          <div className="nu-tray">
            {attachments.map((m, i) => (
              <div className="nu-tray-item" key={i} data-kind={m.kind}>
                {m.kind === "photo" && <img src={m.src} alt="" />}
                {m.kind === "video" && <><video src={m.src} muted /><span className="nu-tray-badge"><Icon name="video" size={13} /></span></>}
                {m.kind === "link" && <div className="nu-tray-link"><Icon name="link" size={16} /><span>{m.site}</span></div>}
                <button className="nu-tray-x" onClick={() => removeAt(i)} aria-label="remove"><Icon name="close" size={13} /></button>
              </div>
            ))}
          </div>
        )}

        {/* inline link input */}
        {linkOpen && (
          <div className="nu-linkinput">
            <Icon name="link" size={16} />
            <input
              autoFocus value={linkVal}
              onChange={(e) => setLinkVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addLink(); if (e.key === "Escape") setLinkOpen(false); }}
              placeholder="Paste a link…"
            />
            <button className="nu-link-add" onClick={addLink}>Add</button>
            <button className="nu-link-cancel" onClick={() => { setLinkOpen(false); setLinkVal(""); }} aria-label="cancel"><Icon name="close" size={14} /></button>
          </div>
        )}

        {err && <div className="nu-cmperr"><Icon name="close" size={14} />{err}</div>}

        {/* toolbar */}
        <div className="nu-composer-bar">
          <div className="nu-tools">
            <button className="nu-tool" onClick={() => photoRef.current.click()} title="Add photos">
              <Icon name="photo" size={19} /><span>Photo</span>
            </button>
            <button className="nu-tool" onClick={() => videoRef.current.click()} title="Add a video">
              <Icon name="video" size={19} /><span>Video</span>
            </button>
            <button className={"nu-tool" + (linkOpen ? " is-on" : "")} onClick={() => setLinkOpen((v) => !v)} title="Add a link">
              <Icon name="link" size={19} /><span>Link</span>
            </button>
            <input ref={photoRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files, "photo"); e.target.value = ""; }} />
            <input ref={videoRef} type="file" accept="video/*" hidden onChange={(e) => { addFiles(e.target.files, "video"); e.target.value = ""; }} />
          </div>
          <div className="nu-composer-actions">
            {onCancel && <button className="nu-btn-ghost" onClick={onCancel}>Cancel</button>}
            <button className="nu-btn-post" disabled={!canPost || checking} onClick={submit}>
              {checking ? <><span className="wr-spin" />Checking…</> : <><Icon name="send" size={16} />{compact ? "Reply" : "Post"}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Composer });
