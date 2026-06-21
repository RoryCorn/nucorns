import { useEffect, useState, useRef, useCallback } from "react";
import { Navigate, Link, useParams, useNavigate } from "react-router-dom";
import Nav from "../components/Nav";
import Icon from "../components/Icon";
import { Avatar } from "../components/Primitives";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

/* ---------- relative time helper ---------- */
function relativeTime(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  const years = Math.floor(days / 365);
  return `${years}y`;
}

/* ---------- Conversation list sidebar ---------- */
function Sidebar({ conversations, activeHandle, user }) {
  return (
    <aside className={`dm-sidebar${activeHandle ? " dm-sidebar-hidden-mobile" : ""}`}>
      <div className="dm-sidebar-head">
        <h2>Messages</h2>
      </div>
      {conversations.length === 0 && (
        <div className="dm-empty">No conversations yet</div>
      )}
      {conversations.map((convo) => {
        const isActive = activeHandle === convo.partner.handle;
        const preview = convo.lastMessage
          ? convo.lastMessage.body.length > 50
            ? convo.lastMessage.body.slice(0, 50) + "…"
            : convo.lastMessage.body
          : "";
        const isMine = convo.lastMessage && convo.lastMessage.fromUserId === user.id;
        return (
          <Link
            to={`/messages/${convo.partner.handle}`}
            key={convo.partner.id}
            className={`dm-convo${isActive ? " active" : ""}`}
          >
            <Avatar user={convo.partner} size={44} />
            <div className="dm-convo-info">
              <div className="dm-convo-top">
                <span className="dm-convo-name">{convo.partner.name}</span>
                {convo.lastMessage && (
                  <span className="dm-convo-time">
                    {relativeTime(convo.lastMessage.createdAt)}
                  </span>
                )}
              </div>
              <div className="dm-convo-preview">
                {isMine && <span className="dm-convo-you">You: </span>}
                {preview}
              </div>
            </div>
            {convo.unread > 0 && (
              <span className="dm-convo-unread">{convo.unread}</span>
            )}
          </Link>
        );
      })}
    </aside>
  );
}

/* ---------- Chat thread ---------- */
function ChatThread({ handle, user }) {
  const [messages, setMessages] = useState([]);
  const [partner, setPartner] = useState(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const msgsEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = useCallback(() => {
    if (msgsEndRef.current) {
      msgsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  /* fetch messages */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api.get(`/messages/${handle}`).then((data) => {
      if (cancelled) return;
      setMessages(data.messages);
      setPartner(data.partner);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [handle]);

  /* scroll to bottom on load and when messages change */
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /* poll every 5s */
  useEffect(() => {
    const interval = setInterval(() => {
      api.get(`/messages/${handle}`).then((data) => {
        setMessages(data.messages);
      }).catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, [handle]);

  /* send message */
  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      const data = await api.post(`/messages/${handle}`, { body: trimmed });
      setMessages((prev) => [...prev, data.message]);
      setBody("");
    } catch {
      /* silently fail */
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <section className="dm-chat">
        <div className="dm-empty">Loading…</div>
      </section>
    );
  }

  return (
    <section className="dm-chat dm-chat-active-mobile">
      <div className="dm-chat-head">
        <button className="dm-back" onClick={() => navigate("/messages")} aria-label="Back to conversations">
          <Icon name="chevron" />
        </button>
        {partner && (
          <Link to={`/@${partner.handle}`} className="dm-chat-head-user">
            <Avatar user={partner} size={32} />
            <div className="dm-chat-head-info">
              <span className="dm-chat-head-name">{partner.name}</span>
              <span className="dm-chat-head-handle">@{partner.handle}</span>
            </div>
          </Link>
        )}
      </div>

      <div className="dm-chat-msgs">
        {messages.length === 0 && (
          <div className="dm-empty">
            No messages yet. Say hello!
          </div>
        )}
        {messages.map((msg) => {
          const isSent = msg.fromUserId === user.id;
          return (
            <div
              key={msg.id}
              className={`dm-msg ${isSent ? "sent" : "received"}`}
            >
              <div className="dm-msg-body">{msg.body}</div>
              <span className="dm-msg-time">{relativeTime(msg.createdAt)}</span>
            </div>
          );
        })}
        <div ref={msgsEndRef} />
      </div>

      <form className="dm-compose" onSubmit={handleSend}>
        <input
          className="dm-input"
          type="text"
          placeholder="Write a message…"
          aria-label="Write a message"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={sending}
        />
        <button
          className="dm-send"
          type="submit"
          disabled={!body.trim() || sending}
          aria-label="Send message"
        >
          <Icon name="send" />
        </button>
      </form>
    </section>
  );
}

/* ---------- Main page ---------- */
export default function MessagesPage() {
  const { handle } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loadingConvos, setLoadingConvos] = useState(true);

  /* fetch conversation list */
  useEffect(() => {
    if (!user) return;
    api.get("/messages/conversations").then((data) => {
      setConversations(data.conversations);
      setLoadingConvos(false);
    }).catch(() => {
      setLoadingConvos(false);
    });
  }, [user, handle]);

  if (authLoading) {
    return (
      <div className="nu-root">
        <Nav />
        <main className="dm-wrap">
          <div className="dm-empty">Loading…</div>
        </main>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/welcome" replace />;
  }

  return (
    <div className="nu-root">
      <Nav />
      <main className="dm-wrap" id="main-content">
        <Sidebar
          conversations={conversations}
          activeHandle={handle}
          user={user}
        />
        {handle ? (
          <ChatThread handle={handle} user={user} />
        ) : (
          <section className="dm-chat">
            <div className="dm-empty">
              <Icon name="send" />
              <p>Select a conversation</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
