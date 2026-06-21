import { Link } from "react-router-dom";
import Icon from "./Icon";
import { nuFmt } from "../lib/format";

export function coverBg(cov) {
  if (cov && cov.src) return { background: `center/cover url(${cov.src})` };
  if (Array.isArray(cov) && cov.length > 2) return { background: `linear-gradient(120deg, ${cov[0]}, ${cov[1]} 55%, ${cov[2]})` };
  if (Array.isArray(cov) && cov.length === 2) return { background: `linear-gradient(135deg, ${cov[0]}, ${cov[1]})` };
  return { background: "linear-gradient(135deg, #FFCB7A, #FF7A1A)" };
}

export default function PostCard({ post, featured }) {
  const inner = (
    <>
      <div className={"pc-cover" + (featured ? " pc-cover-feat" : "")}>
        <div className="nu-ph" style={coverBg(post.cover)}>
          {!(post.cover && post.cover.src) && <span className="nu-ph-stripes" />}
        </div>
        {post.pinned && <span className="pc-pin"><Icon name="bookmark" size={13} />Pinned</span>}
        {post.mine && <span className="pc-pin"><Icon name="sparkle" size={13} />Your story</span>}
      </div>
      <div className="pc-body">
        <div className="pc-cat">
          {post.category}
          {post.groups && post.groups.length > 0 && post.groups.map((g) => (
            <Link key={g.slug} className="pc-group" to={`/g/${g.slug}`} onClick={(e) => e.stopPropagation()}>
              #{g.slug}
            </Link>
          ))}
        </div>
        <h3 className="pc-title">{post.title}</h3>
        <p className="pc-dek">{post.dek}</p>
        <div className="pc-meta">
          <span>{post.date}</span><span className="nu-dot">·</span><span>{post.readTime} read</span>
          <span className="pc-stats">
            <span><Icon name="heart" size={14} />{nuFmt(post.hearts)}</span>
            <span><Icon name="reply" size={14} />{nuFmt(post.comments)}</span>
          </span>
        </div>
        <span className="pc-open">Read & join the conversation <Icon name="chevron" size={15} /></span>
      </div>
    </>
  );
  return <Link className={"pc" + (featured ? " is-featured" : "") + " is-link"} to={`/post/${post.id}`}>{inner}</Link>;
}
