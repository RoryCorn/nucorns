import { Link } from "react-router-dom";
import Icon from "./Icon";
import { Avatar } from "./Primitives";
import { useAuth } from "../lib/AuthContext";
import logo from "/nucorns-mark-circle.png";

export default function Nav() {
  const { user } = useAuth();
  return (
    <header className="nu-nav">
      <div className="nu-nav-inner">
        <Link className="nu-wordmark" to="/"><img className="nu-logo-img" src={logo} alt="" />nu<span>corns</span></Link>
        <div className="nu-search"><Icon name="search" size={18} /><input placeholder="Search creators & stories" /></div>
        <div className="nu-nav-right">
          {user ? (
            <>
              {user.isAdmin && <Link className="nu-btn-ghost nu-admin-link" to="/advertising"><Icon name="lock" size={14} />Admin</Link>}
              <Link className="nu-nav-write" to="/write"><Icon name="sparkle" size={16} />Write</Link>
              <Link to={`/u/${user.handle}`}><Avatar user={user} size={36} /></Link>
            </>
          ) : (
            <Link className="nu-nav-write" to="/welcome"><Icon name="sparkle" size={16} />Join nucorns</Link>
          )}
        </div>
      </div>
    </header>
  );
}
