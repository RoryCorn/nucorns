import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Nav from "../components/Nav";
import Icon from "../components/Icon";
import PostCard from "../components/PostCard";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { nuFmt } from "../lib/format";

export default function GroupPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    setGroup(null);
    setPosts([]);
    setNotFound(false);
    setLoading(true);
    Promise.all([
      api.get(`/groups/${slug}`),
      api.get(`/groups/${slug}/posts`),
    ]).then(([g, p]) => {
      setGroup(g.group);
      setPosts(p.posts);
    }).catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const toggleMembership = async () => {
    if (joining) return;
    setJoining(true);
    try {
      if (group.isMember) {
        await api.post(`/groups/${slug}/leave`);
        setGroup((g) => ({ ...g, isMember: false, memberCount: g.memberCount - 1 }));
      } else {
        await api.post(`/groups/${slug}/join`);
        setGroup((g) => ({ ...g, isMember: true, memberCount: g.memberCount + 1 }));
      }
    } catch (e) {
      /* ignore */
    } finally {
      setJoining(false);
    }
  };

  if (notFound) {
    return (
      <div className="nu-root">
        <Nav />
        <main className="gp-main">
          <p style={{ color: "var(--muted)" }}>Group not found. <Link to="/">Back home</Link></p>
        </main>
      </div>
    );
  }

  if (loading || !group) {
    return (
      <div className="nu-root">
        <Nav />
        <main className="gp-main">
          <p style={{ color: "var(--muted)" }}>Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="nu-root">
      <Nav />
      <main className="gp-main">
        <section className="gp-header">
          <h1 className="gp-name">{group.name}</h1>
          {group.description && <p className="gp-desc">{group.description}</p>}
          <div className="gp-meta">
            <span className="gp-members"><Icon name="user" size={14} /> {nuFmt(group.memberCount)} {group.memberCount === 1 ? "member" : "members"}</span>
            <span className="gp-creator">Created by <Link to={`/u/${group.creator.handle}`}>@{group.creator.handle}</Link></span>
          </div>
          {user && (
            <button
              className={"nu-follow" + (group.isMember ? " is-following" : "")}
              onClick={toggleMembership}
              disabled={joining}
            >
              {group.isMember ? <><Icon name="check" size={15} />Joined</> : "Join"}
            </button>
          )}
        </section>

        <section className="gp-feed">
          {posts.length === 0 && <p className="gp-empty" style={{ color: "var(--muted)" }}>No posts in this group yet.</p>}
          {posts.map((p, i) => (
            <PostCard key={p.id} post={p} featured={i === 0} />
          ))}
        </section>

        <footer className="nu-foot">made with <span className="nu-foot-mark">nucorns</span> · your corner of the internet ✦</footer>
      </main>
    </div>
  );
}
