import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "./Icon";
import { Avatar } from "./Primitives";
import Reaction from "./Reaction";
import { nuFmt } from "../lib/format";

export default function Article({ post, showHero = true }) {
  const [following, setFollowing] = useState(false);
  if (!post) return null;
  const a = post.author;
  const cover = post.cover;
  const heroBg = cover && cover.src
    ? `center/cover url(${cover.src})`
    : `linear-gradient(120deg, ${cover[0]}, ${cover[1]} 55%, ${cover[2] || cover[1]})`;
  return (
    <article className="nu-article">
      <div className="nu-eyebrow"><span className="nu-cat">{post.category}</span><span className="nu-readtime">{post.readTime} read</span></div>
      <h1 className="nu-title">{post.title}</h1>
      <p className="nu-dek">{post.dek}</p>
      <div className="nu-byline">
        {a && <Link to={`/u/${a.handle}`}><Avatar user={a} size={48} ring /></Link>}
        <div className="nu-byline-id">
          {a && <Link to={`/u/${a.handle}`} className="nu-name" style={{ textDecoration: "none", color: "inherit" }}>{a.name}</Link>}
          <span className="nu-byline-sub">{a ? "@" + a.handle + " · " : ""}{post.date}</span>
        </div>
        {!post.mine && (
          <button className={"nu-follow" + (following ? " is-following" : "")} onClick={() => setFollowing((v) => !v)}>
            {following ? <><Icon name="check" size={15} />Following</> : "Follow"}
          </button>
        )}
      </div>
      {showHero && (
        <div className="nu-hero">
          <div className="nu-ph" style={{ background: heroBg }}>
            {!(cover && cover.src) && <span className="nu-ph-stripes" />}
            <span className="nu-ph-label nu-hero-label"><Icon name="photo" size={15} />hero — {post.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 28)}.jpg</span>
          </div>
        </div>
      )}
      <div className="nu-prose">
        {post.body.map((para, i) => <p key={i}>{para}</p>)}
      </div>
      <div className="nu-postbar">
        <Reaction big targetType="post" targetId={post.id} counts={post.reactions} mine={post.myReaction} />
        <button className="nu-pill"><Icon name="reply" size={19} /><span>{nuFmt(post.shares)}</span></button>
        <button className="nu-pill"><Icon name="share" size={18} /><span>Share</span></button>
        <button className="nu-pill nu-pill-bm"><Icon name="bookmark" size={18} /></button>
      </div>
    </article>
  );
}
