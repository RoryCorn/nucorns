import { useState } from "react";
import Icon from "./Icon";
import { nuInitials } from "../lib/format";

/* ---------- Avatar (gradient or uploaded photo) ---------- */
export function Avatar({ user, size = 44, ring = false }) {
  const grad = (user && user.avatarGrad && user.avatarGrad.length >= 2) ? user.avatarGrad : ["#FFD27A", "#FF8A3D"];
  const src = user && user.avatarSrc;
  const name = (user && user.name) || "You";
  return (
    <div
      className="nu-avatar"
      style={{
        width: size, height: size, minWidth: size,
        background: src ? `center/cover url(${src})` : `linear-gradient(135deg, ${grad[0]}, ${grad[1]})`,
        fontSize: size * 0.38,
        boxShadow: ring ? "0 0 0 3px var(--surface), 0 0 0 5px var(--accent)" : "inset 0 0 0 1px rgba(255,255,255,.25)",
      }}
    >
      {!src && nuInitials(name)}
    </div>
  );
}

/* ---------- Photo tile ---------- */
export function PhotoTile({ m, onOpen }) {
  return (
    <button className="nu-media-photo" onClick={onOpen} style={{ aspectRatio: "4 / 3" }}>
      {m.src
        ? <img src={m.src} alt={m.label || "photo"} />
        : <div className="nu-ph" style={{ background: `linear-gradient(135deg, ${(m.grad || ["#FFD79E", "#FF8A3D"])[0]}, ${(m.grad || ["#FFD79E", "#FF8A3D"])[1]})` }}>
            <span className="nu-ph-stripes" />
            <span className="nu-ph-label"><Icon name="photo" size={15} />{m.label || "photo.jpg"}</span>
          </div>}
    </button>
  );
}

/* ---------- Video tile ---------- */
export function VideoTile({ m }) {
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
  const grad = m.grad || ["#9BE7C4", "#1B8BE0"];
  return (
    <div className="nu-media-video" style={{ aspectRatio: "16 / 10" }}>
      <div className="nu-ph" style={{ background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})` }}>
        <span className="nu-ph-stripes" />
      </div>
      <button className="nu-play"><Icon name="play" size={22} /></button>
      {m.dur && <span className="nu-vid-dur">{m.dur}</span>}
      <span className="nu-ph-label nu-vid-label"><Icon name="video" size={15} />{m.label}</span>
    </div>
  );
}

/* ---------- Link card ---------- */
function safeUrl(url) {
  if (!url) return "#";
  const u = url.trim();
  if (/^https?:\/\//i.test(u)) return u;
  return "https://" + u;
}
export function LinkCard({ m }) {
  const href = safeUrl(m.url);
  let domain = m.site;
  try { if (!domain) domain = new URL(href).hostname.replace(/^www\./, ""); } catch (e) { domain = m.url; }
  const title = m.title || m.url;
  return (
    <a className="nu-linkcard" href={href} target="_blank" rel="noreferrer noopener" onClick={(e) => e.stopPropagation()}>
      <div className="nu-linkcard-thumb"><Icon name="link" size={22} /></div>
      <div className="nu-linkcard-body">
        <div className="nu-linkcard-site"><span className="nu-fav" />{domain}</div>
        <div className="nu-linkcard-title">{title}</div>
      </div>
      <span className="nu-linkcard-ext"><Icon name="external" size={16} /></span>
    </a>
  );
}

/* ---------- Media grid (renders attachments) ---------- */
export function MediaGrid({ media, onOpenPhoto }) {
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
