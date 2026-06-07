import { useState } from "react";
import Icon from "./Icon";
import { Avatar, MediaGrid } from "./Primitives";
import Reaction from "./Reaction";
import Composer from "./Composer";

function CommentActions({ targetId, counts, mine, onReply }) {
  return (
    <div className="nu-actions nu-actions-rx">
      <Reaction targetType="comment" targetId={targetId} counts={counts} mine={mine} />
      <button className="nu-act" onClick={onReply}>
        <Icon name="reply" size={18} /><span>Reply</span>
      </button>
      <button className="nu-act nu-share">
        <Icon name="share" size={17} /><span className="nu-act-label">Share</span>
      </button>
    </div>
  );
}

export default function Comment({ data, postId, uploadPath, onReply, onOpenPhoto, depth = 0 }) {
  const [replying, setReplying] = useState(false);

  async function submitReply(payload) {
    await onReply(data.id, payload);
    setReplying(false);
  }

  return (
    <div className={"nu-comment" + (data.isNew ? " is-new" : "")} data-depth={depth}>
      <div className="nu-comment-rail">
        <Avatar user={data.author} size={depth ? 36 : 44} />
        {(data.replies && data.replies.length > 0) || replying ? <span className="nu-thread-line" /> : null}
      </div>
      <div className="nu-comment-body">
        <div className="nu-comment-head">
          <span className="nu-name">{data.author ? data.author.name : "Deleted user"}</span>
          {data.author && <span className="nu-handle">@{data.author.handle}</span>}
          <span className="nu-dot">·</span>
          <span className="nu-time">{data.time}</span>
          {data.author && data.author.isAdmin && <span className="nu-badge-author"><Icon name="sparkle" size={12} />Author</span>}
        </div>
        {data.body && <p className="nu-text">{data.body}</p>}
        <MediaGrid media={data.media} onOpenPhoto={onOpenPhoto} />
        <CommentActions targetId={data.id} counts={data.reactions} mine={data.myReaction} onReply={() => setReplying((v) => !v)} />

        {replying && (
          <div className="nu-replybox">
            <Composer compact autoFocus placeholder={"Reply to " + (data.author ? data.author.name : "this comment") + "…"}
              uploadPath={uploadPath} onSubmit={submitReply} onCancel={() => setReplying(false)} />
          </div>
        )}

        {data.replies && data.replies.length > 0 && (
          <div className="nu-replies">
            {data.replies.map((r) => (
              <Comment key={r.id} data={r} postId={postId} uploadPath={uploadPath} onReply={onReply} onOpenPhoto={onOpenPhoto} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
