// Shared visual primitives for nucorns: Avatar, media tiles, link card, icons.
const { useState } = React;

/* ---------- Avatar ---------- */
function Avatar({ who, size = 44, ring = false }) {
  const a = NU_AVATARS[who] || NU_AVATARS.you;
  return (
    <div
      className="nu-avatar"
      style={{
        width: size, height: size, minWidth: size,
        background: `linear-gradient(135deg, ${a.grad[0]}, ${a.grad[1]})`,
        fontSize: size * 0.38,
        boxShadow: ring ? "0 0 0 3px var(--surface), 0 0 0 5px var(--accent)" : "none",
      }}
    >
      {nuInitials(a.name)}
    </div>
  );
}

/* ---------- Icons (simple, single-stroke) ---------- */
function Icon({ name, size = 20, fill = "none" }) {
  const s = { width: size, height: size, stroke: "currentColor", strokeWidth: 1.8, fill, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    heart: <path d="M12 20s-7-4.35-9.5-8.5C1 8.5 2.5 5 6 5c2 0 3.2 1.2 4 2.3C10.8 6.2 12 5 14 5c3.5 0 5 3.5 3.5 6.5C19 15.65 12 20 12 20z" />,
    reply: <path d="M9 17l-5-5 5-5M4 12h11a4 4 0 014 4v2" />,
    share: <g><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="M8.2 10.8l7.6-4.6M8.2 13.2l7.6 4.6" /></g>,
    photo: <g><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="8.5" cy="9.5" r="1.6" /><path d="M21 16l-5-5L5 20" /></g>,
    video: <g><rect x="2.5" y="6" width="13" height="12" rx="3" /><path d="M15.5 10l6-3v10l-6-3z" /></g>,
    link: <g><path d="M10 13a4 4 0 005.66 0l2.5-2.5a4 4 0 10-5.66-5.66L11 6.5" /><path d="M14 11a4 4 0 00-5.66 0L5.84 13.5a4 4 0 105.66 5.66L13 17.5" /></g>,
    close: <path d="M6 6l12 12M18 6L6 18" />,
    play: <path d="M8 5v14l11-7z" fill="currentColor" stroke="none" />,
    bookmark: <path d="M6 4h12v16l-6-4-6 4z" />,
    send: <path d="M4 12l16-8-6 16-3-7-7-1z" />,
    sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />,
    check: <path d="M5 12l5 5L20 6" />,
    search: <g><circle cx="11" cy="11" r="6" /><path d="M20 20l-3.5-3.5" /></g>,
    external: <g><path d="M14 5h5v5" /><path d="M19 5l-8 8" /><path d="M18 13v6H5V6h6" /></g>,
    chevron: <path d="M6 9l6 6 6-6" />,
    thumb: <g><path d="M7 21.5V10.2l3.9-7a1 1 0 0 1 .9-.5c1.2 0 2.1 1 2.1 2.2V8h4.6c1.3 0 2.3 1.2 2 2.5l-1.6 7.2a2 2 0 0 1-2 1.6H7z" /><path d="M7 10.2H4.4c-.8 0-1.4.6-1.4 1.4v8.5c0 .8.6 1.4 1.4 1.4H7" /></g>,
    megaphone: <g><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z" /><path d="M15 8a4 4 0 0 1 0 8" /></g>,
    audio: <g><path d="M9 18V7l10-2v11" /><circle cx="6" cy="18" r="2.5" /><circle cx="16" cy="16" r="2.5" /></g>,
    lock: <g><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></g>,
    plus: <path d="M12 5v14M5 12h14" />,
  };
  return <svg viewBox="0 0 24 24" style={s} aria-hidden="true">{paths[name]}</svg>;
}

/* ---------- Photo tile ---------- */
function PhotoTile({ m, onOpen }) {
  // m.src => real uploaded image; otherwise gradient placeholder
  return (
    <button className="nu-media-photo" onClick={onOpen} style={{ aspectRatio: "4 / 3" }}>
      {m.src
        ? <img src={m.src} alt={m.label || "photo"} />
        : <div className="nu-ph" style={{ background: `linear-gradient(135deg, ${m.grad[0]}, ${m.grad[1]})` }}>
            <span className="nu-ph-stripes" />
            <span className="nu-ph-label"><Icon name="photo" size={15} />{m.label || "photo.jpg"}</span>
          </div>}
    </button>
  );
}

/* ---------- Video tile ---------- */
function VideoTile({ m }) {
  const [playing, setPlaying] = useState(false);
  if (m.src) {
    return (
      <div className="nu-media-video">
        <video src={m.src} controls={playing} playsInline
          onClick={(e) => { setPlaying(true); e.currentTarget.play(); }} />
        {!playing && <button className="nu-play" onClick={(e) => { setPlaying(true); const v = e.currentTarget.previousSibling; v.play(); }}><Icon name="play" size={22} /></button>}
      </div>
    );
  }
  return (
    <div className="nu-media-video" style={{ aspectRatio: "16 / 10" }}>
      <div className="nu-ph" style={{ background: `linear-gradient(135deg, ${m.grad[0]}, ${m.grad[1]})` }}>
        <span className="nu-ph-stripes" />
      </div>
      <button className="nu-play"><Icon name="play" size={22} /></button>
      {m.dur && <span className="nu-vid-dur">{m.dur}</span>}
      <span className="nu-ph-label nu-vid-label"><Icon name="video" size={15} />{m.label}</span>
    </div>
  );
}

/* ---------- Link card ---------- */
function LinkCard({ m }) {
  let domain = m.site;
  try { if (!domain) domain = new URL(m.url).hostname.replace(/^www\./, ""); } catch (e) { domain = m.url; }
  const title = m.title || m.url;
  return (
    <a className="nu-linkcard" href={m.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
      <div className="nu-linkcard-thumb"><Icon name="link" size={22} /></div>
      <div className="nu-linkcard-body">
        <div className="nu-linkcard-site"><span className="nu-fav" />{domain}</div>
        <div className="nu-linkcard-title">{title}</div>
      </div>
      <span className="nu-linkcard-ext"><Icon name="external" size={16} /></span>
    </a>
  );
}

/* ---------- Media grid (renders a comment's attachments) ---------- */
function MediaGrid({ media, onOpenPhoto }) {
  if (!media || !media.length) return null;
  const photos = media.filter((m) => m.kind === "photo");
  const others = media.filter((m) => m.kind !== "photo");
  return (
    <div className="nu-mediagrid">
      {photos.length > 0 && (
        <div className="nu-photogrid" data-count={Math.min(photos.length, 4)}>
          {photos.slice(0, 4).map((m, i) => (
            <PhotoTile key={i} m={m} onOpen={() => onOpenPhoto && onOpenPhoto(m)} />
          ))}
        </div>
      )}
      {others.map((m, i) =>
        m.kind === "video" ? <VideoTile key={"v" + i} m={m} /> : <LinkCard key={"l" + i} m={m} />
      )}
    </div>
  );
}

/* ---------- Portrait (arbitrary gradient avatar) ---------- */
function Portrait({ grad, name, src, size = 44, ring = false }) {
  return (
    <div
      className="nu-avatar"
      style={{
        width: size, height: size, minWidth: size,
        background: src ? `center/cover url(${src})` : `linear-gradient(135deg, ${grad[0]}, ${grad[1]})`,
        fontSize: size * 0.36,
        boxShadow: ring ? "0 0 0 4px var(--surface), 0 0 0 6px var(--accent)" : "inset 0 0 0 1px rgba(255,255,255,.25)",
      }}
    >
      {!src && nuInitials(name || "You")}
    </div>
  );
}

Object.assign(window, { Avatar, Icon, PhotoTile, VideoTile, LinkCard, MediaGrid, Portrait });
