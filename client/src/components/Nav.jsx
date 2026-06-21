import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "./Icon";
import { Avatar } from "./Primitives";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import logo from "/nucorns-mark-circle.png";

function AvatarMenu({ user }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDown(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  async function doLogout() {
    setOpen(false);
    await logout();
    navigate("/");
  }

  return (
    <div className="nu-avatar-menu" ref={ref}>
      <button className="nu-avatar-btn" onClick={() => setOpen((v) => !v)} aria-label="Account menu">
        <Avatar user={user} size={36} />
      </button>
      {open && (
        <div className="nu-avatar-drop">
          <div className="nu-avatar-drop-name">{user.name}</div>
          <div className="nu-avatar-drop-handle">@{user.handle}</div>
          <div className="nu-avatar-drop-divider" />
          <Link className="nu-avatar-drop-item" to={`/u/${user.handle}`} onClick={() => setOpen(false)}>
            <Icon name="user" size={15} />Profile
          </Link>
          <Link className="nu-avatar-drop-item" to="/settings" onClick={() => setOpen(false)}>
            <Icon name="settings" size={15} />Settings
          </Link>
          <div className="nu-avatar-drop-divider" />
          <button className="nu-avatar-drop-item nu-avatar-drop-signout" onClick={doLogout}>
            <Icon name="close" size={15} />Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function MsgLink() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    api.get("/messages/unread").then((d) => setCount(d.count || 0)).catch(() => {});
    const iv = setInterval(() => { api.get("/messages/unread").then((d) => setCount(d.count || 0)).catch(() => {}); }, 30000);
    return () => clearInterval(iv);
  }, []);
  return (
    <Link className="nu-nav-msg" to="/messages" aria-label="Messages">
      <Icon name="message" size={20} />
      {count > 0 && <span className="nu-nav-msg-badge">{count > 9 ? "9+" : count}</span>}
    </Link>
  );
}

export default function Nav() {
  const { user } = useAuth();
  return (
    <header className="nu-nav" role="banner">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <nav className="nu-nav-inner" aria-label="Main navigation">
        <Link className="nu-wordmark" to="/"><img className="nu-logo-img" src={logo} alt="nucorns home" />nu<span>corns</span></Link>
        <div className="nu-search"><Icon name="search" size={18} /><input placeholder="Search creators & stories" aria-label="Search creators and stories" /></div>
        <div className="nu-nav-right">
          {user ? (
            <>
              {user.isAdmin && <Link className="nu-btn-ghost nu-admin-link" to="/advertising"><Icon name="lock" size={14} />Admin</Link>}
              <MsgLink />
              <Link className="nu-nav-write" to="/write"><Icon name="sparkle" size={16} />Write</Link>
              <AvatarMenu user={user} />
            </>
          ) : (
            <Link className="nu-nav-write" to="/welcome"><Icon name="sparkle" size={16} />Join nucorns</Link>
          )}
        </div>
      </nav>
    </header>
  );
}
