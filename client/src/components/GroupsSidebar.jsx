import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "./Icon";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

export default function GroupsSidebar() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    api.get("/groups").then((d) => setGroups(d.groups || [])).catch(() => {});
  }, []);

  async function create() {
    const slug = name.replace(/^#/, "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (slug.length < 2 || busy) return;
    setErr(""); setBusy(true);
    try {
      const res = await api.post("/groups", { name, description: desc });
      setGroups((prev) => [res.group, ...prev]);
      setName(""); setDesc(""); setShowCreate(false);
    } catch (e) {
      setErr(e.message || "Couldn't create group.");
    } finally {
      setBusy(false);
    }
  }

  const list = (
    <>
      {groups.length === 0 && <div className="gs-empty">No groups yet — create the first one!</div>}

      <div className="gs-list">
        {groups.map((g) => (
          <Link key={g.slug} className="gs-item" to={`/g/${g.slug}`}>
            <span className="gs-item-name">{g.name}</span>
            <span className="gs-item-count">{g.memberCount}</span>
          </Link>
        ))}
      </div>

      {user && (
        showCreate ? (
          <div className="gs-create-form">
            <input className="su-input" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="#groupname" maxLength={42} autoFocus aria-label="Group name" />
            <input className="su-input" value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="Description (optional)" maxLength={200} aria-label="Group description" />
            {err && <span className="su-err" role="alert"><Icon name="close" size={13} />{err}</span>}
            <div className="gs-create-btns">
              <button className="nu-btn-post" disabled={name.replace(/^#/, "").replace(/[^a-z0-9]/gi, "").length < 2 || busy} onClick={create}>
                {busy ? "Creating…" : "Create"}
              </button>
              <button className="nu-btn-ghost" onClick={() => { setShowCreate(false); setErr(""); }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button className="gs-create-btn" onClick={() => setShowCreate(true)}>
            <Icon name="plus" size={14} />Create Group
          </button>
        )
      )}
    </>
  );

  return (
    <nav className="gs-sidebar" aria-label="Groups">
      {/* Desktop: always visible */}
      <div className="gs-desktop">
        <div className="gs-title">Special Interest Groups</div>
        {list}
      </div>

      {/* Mobile: dropdown toggle */}
      <div className="gs-mobile">
        <button className="gs-mobile-toggle" onClick={() => setMobileOpen((v) => !v)}>
          <Icon name="hash" size={16} />
          Special Interest Groups
          <span className={"gs-chevron" + (mobileOpen ? " gs-chevron-open" : "")}><Icon name="chevron" size={14} /></span>
        </button>
        {mobileOpen && <div className="gs-mobile-content">{list}</div>}
      </div>
    </nav>
  );
}
