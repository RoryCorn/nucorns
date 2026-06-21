import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Nav from "../components/Nav";
import Icon from "../components/Icon";
import { Avatar } from "../components/Primitives";
import PostCard, { coverBg } from "../components/PostCard";
import MatchSection from "../components/MatchSection";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { nuFmt } from "../lib/format";

export default function ProfilePage() {
  const { handle } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState("posts");
  const [following, setFollowing] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setProfile(null); setNotFound(false);
    Promise.all([
      api.get(`/users/${handle}`),
      api.get(`/posts?author=${encodeURIComponent(handle)}`),
    ]).then(([u, p]) => {
      setProfile(u.user);
      setPosts(p.posts);
    }).catch(() => setNotFound(true));
  }, [handle]);

  if (notFound) {
    return <div className="nu-root"><Nav /><main className="pf-main"><p style={{ color: "var(--muted)" }}>That creator couldn't be found. <Link to="/">Back home</Link></p></main></div>;
  }
  if (!profile) {
    return <div className="nu-root"><Nav /><main className="pf-main"><p style={{ color: "var(--muted)" }}>Loading…</p></main></div>;
  }

  const isMine = user && user.id === profile.id;
  const featured = posts.find((p) => p.pinned) || posts[0];
  const rest = posts.filter((p) => p !== featured);
  const banner = profile.bannerGrad && profile.bannerGrad.length
    ? `linear-gradient(120deg, ${profile.bannerGrad[0]}, ${profile.bannerGrad[1]} 55%, ${profile.bannerGrad[2] || profile.bannerGrad[1]})`
    : "linear-gradient(120deg, #FFCB7A, #FF7A1A 55%, #1FA8F0)";

  return (
    <div className="nu-root">
      <Nav />
      <main className="pf-main">
        <div className="pf-banner" style={{ background: banner }}>
          <span className="nu-ph-stripes" />
        </div>

        <section className="pf-head">
          <div className="pf-av"><Avatar user={profile} size={120} ring /></div>
          <div className="pf-id">
            <div className="pf-id-row">
              <div>
                <h1 className="pf-name">{profile.name}</h1>
                <div className="pf-handle">@{profile.handle}{profile.location ? " · " + profile.location : ""} · {profile.joined}</div>
              </div>
              <div className="pf-actions">
                {isMine
                  ? <Link className="nu-follow is-following pf-edit" to="/settings"><Icon name="sparkle" size={15} />Edit profile</Link>
                  : <>
                      <button className={"nu-follow" + (following ? " is-following" : "")} onClick={() => setFollowing((v) => !v)}>
                        {following ? <><Icon name="check" size={15} />Following</> : "Follow"}
                      </button>
                      {user && <Link className="nu-pill pf-msg" to={`/messages/${profile.handle}`}><Icon name="message" size={16} />Message</Link>}
                    </>}
                <button className="nu-pill pf-share"><Icon name="share" size={17} />Share</button>
              </div>
            </div>
            <p className="pf-bio">{profile.bio}</p>
            <div className="pf-chips">
              {profile.interests.map((i) => <span key={i} className="pf-chip">{i}</span>)}
            </div>
            <div className="pf-stats">
              <span><strong>{posts.length}</strong> stories</span>
              <span><strong>{nuFmt(profile.followers)}</strong> followers</span>
              <span><strong>{nuFmt(profile.following)}</strong> following</span>
            </div>
          </div>
        </section>

        <nav className="pf-tabs">
          {["posts", "media", "about"].map((id) => (
            <button key={id} className={"pf-tab" + (tab === id ? " is-on" : "")} onClick={() => setTab(id)}>
              {id === "posts" ? "Stories" : id[0].toUpperCase() + id.slice(1)}
            </button>
          ))}
        </nav>

        {tab === "posts" && (
          <section className="pf-feed">
            {isMine && (
              <Link className="pf-writecta" to="/write">
                <span className="pf-writecta-ic"><Icon name="sparkle" size={18} /></span>
                <span className="pf-writecta-tx"><strong>Write a story</strong>Share something new with your readers</span>
                <Icon name="chevron" size={18} />
              </Link>
            )}
            {!featured && <p style={{ color: "var(--muted)" }}>No stories published yet.</p>}
            {featured && <PostCard post={featured} featured />}
            <div className="pf-grid">
              {rest.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          </section>
        )}

        {tab === "media" && (
          <section className="pf-media">
            {posts.length === 0 && <p style={{ color: "var(--muted)" }}>No media yet.</p>}
            {posts.map((p) => (
              <div key={p.id} className="pf-media-tile"><div className="nu-ph" style={coverBg(p.cover)}>{!(p.cover && p.cover.src) && <span className="nu-ph-stripes" />}</div></div>
            ))}
          </section>
        )}

        {tab === "about" && (
          <section className="pf-about">
            <h3>About</h3>
            <p>{profile.bio}</p>
            <h3>Interests</h3>
            <div className="pf-chips">{profile.interests.map((i) => <span key={i} className="pf-chip">{i}</span>)}</div>
            <h3>Details</h3>
            <ul className="pf-details">
              <li><span>Location</span><strong>{profile.location || "—"}</strong></li>
              <li><span>Member</span><strong>{profile.joined}</strong></li>
              <li><span>Handle</span><strong>@{profile.handle}</strong></li>
            </ul>
          </section>
        )}

        {isMine && <MatchSection />}

        <footer className="nu-foot">made with <span className="nu-foot-mark">nucorns</span> · your corner of the internet ✦ · <Link to="/advertising">Advertise</Link></footer>
      </main>
    </div>
  );
}
