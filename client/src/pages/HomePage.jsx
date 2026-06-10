import { useEffect, useState } from "react";
import Nav from "../components/Nav";
import PostCard from "../components/PostCard";
import { AdSlot } from "../components/Ads";
import { api } from "../lib/api";

const AD_SLOTS = ["home-1","home-2","home-3","home-4","home-5","home-6","home-7","home-8"];

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/posts").then((d) => setPosts(d.posts)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="nu-root">
      <Nav />
      <div className="hm-wrap">
        <main className="hm-feed">
          {loading && <p style={{ color: "var(--muted)" }}>Loading…</p>}
          {!loading && posts.length === 0 && <p style={{ color: "var(--muted)" }}>No stories yet — be the first to write one.</p>}
          {posts.map((p, i) => (
            <PostCard key={p.id} post={p} featured={i === 0} />
          ))}
        </main>

        <aside className="hm-sidebar">
          <div className="hm-sidebar-inner">
            <div className="hm-sidebar-label">Sponsored</div>
            {AD_SLOTS.map((id) => <AdSlot key={id} slotId={id} />)}
          </div>
        </aside>
      </div>
      <footer className="nu-foot">made with <span className="nu-foot-mark">nucorns</span> · your corner of the internet ✦</footer>
    </div>
  );
}
