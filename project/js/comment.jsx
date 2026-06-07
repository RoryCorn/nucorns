// A single comment: body, media, like/reply/share actions, nested replies.
const { useState } = React;

function CommentActions({ seed, onReply }) {
  return (
    <div className="nu-actions nu-actions-rx">
      <Reaction seed={seed} />
      <button className="nu-act" onClick={onReply}>
        <Icon name="reply" size={18} /><span>Reply</span>
      </button>
      <button className="nu-act nu-share">
        <Icon name="share" size={17} /><span className="nu-act-label">Share</span>
      </button>
    </div>
  );
}

function Comment({ data, onLike, onReply, onOpenPhoto, depth = 0 }) {
  const a = NU_AVATARS[data.author] || NU_AVATARS.you;
  const [replying, setReplying] = useState(false);
  const rxSeed = { up: data.likes, mixed: Math.round(data.likes * 0.06), down: Math.round(data.likes * 0.04) };

  function submitReply(payload) {
    onReply(data.id, payload);
    setReplying(false);
  }

  return (
    <div className={"nu-comment" + (data.isNew ? " is-new" : "")} data-depth={depth}>
      <div className="nu-comment-rail">
        <Avatar who={data.author} size={depth ? 36 : 44} />
        {(data.replies && data.replies.length > 0) || replying ? <span className="nu-thread-line" /> : null}
      </div>
      <div className="nu-comment-body">
        <div className="nu-comment-head">
          <span className="nu-name">{a.name}</span>
          <span className="nu-handle">@{a.handle}</span>
          <span className="nu-dot">·</span>
          <span className="nu-time">{data.time}</span>
          {data.author === "maya" && <span className="nu-badge-author"><Icon name="sparkle" size={12} />Author</span>}
        </div>
        {data.body && <p className="nu-text">{data.body}</p>}
        <MediaGrid media={data.media} onOpenPhoto={onOpenPhoto} />
        <CommentActions seed={rxSeed} onReply={() => setReplying((v) => !v)} />

        {replying && (
          <div className="nu-replybox">
            <Composer who="you" compact autoFocus placeholder={"Reply to " + a.name + "…"} onSubmit={submitReply} onCancel={() => setReplying(false)} />
          </div>
        )}

        {data.replies && data.replies.length > 0 && (
          <div className="nu-replies">
            {data.replies.map((r) => (
              <Comment key={r.id} data={r} onLike={onLike} onReply={onReply} onOpenPhoto={onOpenPhoto} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { Comment });
