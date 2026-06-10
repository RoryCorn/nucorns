import { useState, useRef, useEffect } from "react";
import { useNavigate, Link, Navigate, useSearchParams } from "react-router-dom";
import Icon from "../components/Icon";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

const WR_CATS = ["Field Notes", "Gear", "Essay", "Tutorial", "Personal"];
const WR_COVERS = [
  ["#FFCB7A", "#FF7A1A", "#1FA8F0"], ["#6FD0FF", "#1B8BE0", "#7A5AF0"],
  ["#9BE7C4", "#2BB673", "#1FA8F0"], ["#C9B6FF", "#7A5AF0", "#F0568F"],
  ["#FFD27A", "#FF8A3D", "#F0568F"],
];

function autogrow(el) { if (!el) return; el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }

export default function WritePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("edit");

  const [cat, setCat] = useState(WR_CATS[0]);
  const [title, setTitle] = useState("");
  const [dek, setDek] = useState("");
  const [body, setBody] = useState("");
  const [coverGrad, setCoverGrad] = useState(WR_COVERS[0]);
  const [coverSrc, setCoverSrc] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [status, setStatus] = useState("idle"); // idle|checking|blocked|loading
  const [alert, setAlert] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const coverRef = useRef(null);
  const photoRef = useRef(null);

  useEffect(() => {
    if (!editId) return;
    setStatus("loading");
    api.get(`/posts/${editId}`).then(({ post }) => {
      if (!post) return;
      setCat(WR_CATS.includes(post.category) ? post.category : WR_CATS[0]);
      setTitle(post.title || "");
      setDek(post.dek || "");
      setBody(Array.isArray(post.body) ? post.body.join("\n\n") : post.body || "");
      if (post.cover && post.cover.src) {
        setCoverSrc(post.cover.src);
      } else if (Array.isArray(post.cover) && post.cover.length) {
        const match = WR_COVERS.find((g) => g[0] === post.cover[0] && g[1] === post.cover[1]);
        setCoverGrad(match || WR_COVERS[0]);
      }
      setPhotos(Array.isArray(post.media) ? post.media : []);
      setStatus("idle");
    }).catch(() => setStatus("idle"));
  }, [editId]);

  if (authLoading || status === "loading") return null;
  if (!user) return <Navigate to="/welcome" replace />;

  async function onCover(file) {
    if (!file) return;
    setAlert(null);
    try {
      const r = await api.upload("/posts/media/upload", file);
      setCoverSrc(r.url);
    } catch (e) {
      setAlert({ kind: "photo", title: "Cover can't be used", msg: e.message });
    }
  }

  async function onPhotos(files) {
    setAlert(null);
    for (const f of Array.from(files)) {
      try {
        const r = await api.upload("/posts/media/upload", f);
        setPhotos((p) => [...p, { src: r.url, kind: r.kind }]);
      } catch (e) {
        setAlert({ kind: "photo", title: "A photo was blocked", msg: e.message });
      }
    }
  }

  function removePhoto(i) { setPhotos((p) => p.filter((_, idx) => idx !== i)); }

  const canPublish = title.trim().length >= 4 && body.trim().length >= 12;

  async function publish() {
    if (!canPublish || status === "checking") return;
    setAlert(null); setStatus("checking");
    try {
      const payload = {
        category: cat,
        title: title.trim(),
        dek: dek.trim(),
        body: body.trim(),
        cover: coverSrc ? { src: coverSrc } : coverGrad,
        media: photos,
      };
      const res = editId
        ? await api.patch(`/posts/${editId}`, payload)
        : await api.post("/posts", payload);
      navigate(`/post/${res.post.id}`);
    } catch (e) {
      setStatus("blocked");
      if (e.data && e.data.error === "blocked") {
        setAlert({ kind: "text", title: e.data.title || "This needs an edit before it goes live", msg: e.data.message, cats: e.data.categories });
      } else {
        setAlert({ kind: "text", title: "Couldn't save", msg: e.message });
      }
    }
  }

  async function deleteStory() {
    try {
      await api.del(`/posts/${editId}`);
      navigate(`/u/${user.handle}`);
    } catch (e) {
      setAlert({ kind: "text", title: "Couldn't delete", msg: e.message });
      setConfirmDelete(false);
    }
  }

  const coverStyle = coverSrc
    ? { background: `center/cover url(${coverSrc})` }
    : { background: `linear-gradient(120deg, ${coverGrad[0]}, ${coverGrad[1]} 55%, ${coverGrad[2]})` };

  return (
    <div className="nu-root">
      <header className="nu-nav">
        <div className="nu-nav-inner">
          <Link className="nu-wordmark" to={`/u/${user.handle}`}><img className="nu-logo-img" src="/nucorns-mark-circle.png" alt="" />nu<span>corns</span></Link>
          <div className="wr-navmid">{editId ? "Edit story" : "New story"}</div>
          <div className="nu-nav-right">
            {editId && (
              <button className="nu-btn-ghost nu-btn-danger" onClick={() => setConfirmDelete(true)}>Delete</button>
            )}
            <Link className="nu-btn-ghost" to={editId ? `/post/${editId}` : `/u/${user.handle}`}>Cancel</Link>
            <button className="nu-btn-post" disabled={!canPublish || status === "checking"} onClick={publish}>
              {status === "checking" ? <><span className="wr-spin" />Checking…</> : <><Icon name="sparkle" size={16} />{editId ? "Save" : "Publish"}</>}
            </button>
          </div>
        </div>
      </header>

      {confirmDelete && (
        <div className="nu-confirm-overlay">
          <div className="nu-confirm">
            <h3>Delete this story?</h3>
            <p>This removes the story, all its comments, and any uploaded media. This can't be undone.</p>
            <div className="nu-confirm-btns">
              <button className="nu-btn-ghost" onClick={() => setConfirmDelete(false)}>Keep it</button>
              <button className="nu-btn-post nu-btn-delete" onClick={deleteStory}>Yes, delete</button>
            </div>
          </div>
        </div>
      )}

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

        <div className="wr-cats">
          {WR_CATS.map((c) => (
            <button key={c} className={"wr-cat" + (cat === c ? " is-on" : "")} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>

        <textarea className="wr-title" rows={1} placeholder="Your story title…" value={title}
          onChange={(e) => { setTitle(e.target.value); autogrow(e.target); }} />
        <textarea className="wr-dek" rows={1} placeholder="Add a subtitle (optional)" value={dek}
          onChange={(e) => { setDek(e.target.value); autogrow(e.target); }} />
        <textarea className="wr-body" rows={6} placeholder="Tell your story. Leave a blank line between paragraphs." value={body}
          onChange={(e) => { setBody(e.target.value); autogrow(e.target); }} />

        <div className="wr-gallery">
          {photos.map((p, i) => (
            <div className="wr-ph" key={i}>
              {p.kind === "video" ? <video src={p.src} muted /> : <img src={p.src} alt="" />}
              <button className="nu-tray-x" onClick={() => removePhoto(i)}><Icon name="close" size={13} /></button>
            </div>
          ))}
          <button className="wr-addph" onClick={() => photoRef.current.click()}>
            <Icon name="photo" size={20} /><span>Add photos / video</span>
          </button>
          <input ref={photoRef} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => { onPhotos(e.target.files); e.target.value = ""; }} />
        </div>

        <div className="wr-guide">
          <Icon name="heart" size={15} />
          <span>Before publishing, a quick safety check runs automatically. {""}
          <strong>No nudity, harassment, or hateful language</strong> — see <a href="#" onClick={(e) => e.preventDefault()}>community guidelines</a>.</span>
        </div>
      </main>
    </div>
  );
}
