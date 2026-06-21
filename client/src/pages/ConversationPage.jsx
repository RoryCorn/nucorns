import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Nav from "../components/Nav";
import Article from "../components/Article";
import Lightbox from "../components/Lightbox";
import Composer from "../components/Composer";
import Comment from "../components/Comment";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { useAppearance } from "../lib/AppearanceContext";

function countAll(list) {
  return list.reduce((n, c) => n + 1 + (c.replies ? countAll(c.replies) : 0), 0);
}

export default function ConversationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { appearance } = useAppearance();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [sort, setSort] = useState("top");
  const [lightbox, setLightbox] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const uploadPath = `/posts/${id}/comments/media`;

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get(`/posts/${id}`),
      api.get(`/posts/${id}/comments`),
    ]).then(([p, c]) => {
      setPost(p.post);
      setComments(c.comments);
      setNotFound(false);
    }).catch(() => setNotFound(true)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const total = useMemo(() => countAll(comments), [comments]);

  const ordered = useMemo(() => {
    const c = [...comments];
    if (sort === "top") c.sort((a, b) => ((b.reactions && b.reactions.up) || 0) - ((a.reactions && a.reactions.up) || 0));
    else c.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return c;
  }, [comments, sort]);

  async function addComment(payload) {
    const res = await api.post(`/posts/${id}/comments`, payload);
    setComments((cs) => [{ ...res.comment, isNew: true }, ...cs]);
    setSort("new");
  }

  async function addReply(parentId, payload) {
    const res = await api.post(`/posts/${id}/comments`, { ...payload, parentId });
    const reply = { ...res.comment, isNew: true };
    setComments((cs) => addReplyIn(cs, parentId, reply));
  }

  function addReplyIn(list, parentId, reply) {
    return list.map((c) => {
      if (c.id === parentId) return { ...c, replies: [...(c.replies || []), reply] };
      if (c.replies && c.replies.length) return { ...c, replies: addReplyIn(c.replies, parentId, reply) };
      return c;
    });
  }

  if (loading) return <div className="nu-root"><Nav /><main className="nu-main"><p style={{ color: "var(--muted)" }}>Loading…</p></main></div>;
  if (notFound || !post) {
    return (
      <div className="nu-root"><Nav />
        <main className="nu-main">
          <p style={{ color: "var(--muted)" }}>That story couldn't be found. <Link to="/">Back home</Link></p>
        </main>
      </div>
    );
  }

  return (
    <div className="nu-root">
      <Nav />
      <main className="nu-main" id="main-content">
        <Article post={post} showHero={appearance.showHero} />

        {post.mine && (
          <div className="nu-post-actions">
            <Link className="nu-btn-ghost" to={`/write?edit=${post.id}`}>Edit story</Link>
            <button className="nu-btn-ghost nu-btn-danger" onClick={async () => {
              if (!window.confirm("Delete this story and all its comments? This can't be undone.")) return;
              await api.del(`/posts/${post.id}`);
              navigate("/");
            }}>Delete story</button>
          </div>
        )}

        <section className="nu-convo">
          <div className="nu-convo-head">
            <h2 className="nu-convo-title">Conversation <span>{total}</span></h2>
            <div className="nu-sort">
              <button className={sort === "top" ? "is-on" : ""} onClick={() => setSort("top")}>Top</button>
              <button className={sort === "new" ? "is-on" : ""} onClick={() => setSort("new")}>Newest</button>
            </div>
          </div>

          {user ? (
            <div className="nu-composer-wrap">
              <Composer uploadPath={uploadPath} onSubmit={addComment} />
            </div>
          ) : (
            <div className="nu-composer-wrap">
              <p style={{ color: "var(--muted)", fontSize: 14.5 }}><Link to="/welcome">Sign in</Link> to join the conversation.</p>
            </div>
          )}

          <div className="nu-comment-list">
            {ordered.map((c) => (
              <Comment key={c.id} data={c} postId={id} uploadPath={uploadPath} onReply={addReply} onOpenPhoto={setLightbox} />
            ))}
          </div>
        </section>
        <footer className="nu-foot">made with <span className="nu-foot-mark">nucorns</span> · be kind in the comments ✦ · <Link to="/privacy">Privacy</Link></footer>
      </main>

      <Lightbox m={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
