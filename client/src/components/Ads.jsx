import { useEffect, useState } from "react";
import Icon from "./Icon";
import { api } from "../lib/api";

function safeUrl(url) {
  if (!url) return null;
  const u = url.trim();
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  return "https://" + u;
}

export function AdUnit({ ad }) {
  const cta = ad.cta || "Learn more";
  const href = safeUrl(ad.url);

  const ctaBtn = href
    ? <a className="ad-cta" href={href} target="_blank" rel="noreferrer noopener">{cta}<Icon name="external" size={14} /></a>
    : null;

  const tag = (
    <div className="ad-tag"><span className="ad-dot" />Sponsored{ad.company ? " · " + ad.company : ""}</div>
  );

  if (ad.format === "photo") {
    return (
      <div className="ad-unit" data-format="photo">
        {tag}
        <div className="ad-photo">
          {ad.mediaSrc
            ? <img src={ad.mediaSrc} alt={ad.headline || ""} />
            : <div className="nu-ph" style={{ background: "linear-gradient(135deg,#FFD27A,#FF8A3D)" }}><span className="nu-ph-stripes" /></div>}
        </div>
        <div className="ad-body">
          <div className="ad-head">{ad.headline}</div>
          {ad.body && <div className="ad-sub">{ad.body}</div>}
          {ctaBtn}
        </div>
      </div>
    );
  }

  if (ad.format === "video") {
    return (
      <div className="ad-unit" data-format="video">
        {tag}
        <div className="ad-photo">
          {ad.mediaSrc
            ? <video src={ad.mediaSrc} controls playsInline />
            : <div className="nu-ph" style={{ background: "linear-gradient(135deg,#6FD0FF,#1B8BE0)" }}><span className="nu-ph-stripes" /></div>}
        </div>
        <div className="ad-body">
          <div className="ad-head">{ad.headline}</div>
          {ad.body && <div className="ad-sub">{ad.body}</div>}
          {ctaBtn}
        </div>
      </div>
    );
  }

  if (ad.format === "audio") {
    return (
      <div className="ad-unit" data-format="audio">
        {tag}
        <div className="ad-audio">
          <div className="ad-audio-ic"><Icon name="audio" size={22} /></div>
          <div className="ad-body">
            <div className="ad-head">{ad.headline}</div>
            {ad.mediaSrc && <audio src={ad.mediaSrc} controls />}
            {ctaBtn}
          </div>
        </div>
      </div>
    );
  }

  if (ad.format === "link") {
    let host = ad.url || "";
    try { host = new URL(safeUrl(ad.url) || "").hostname.replace(/^www\./, ""); } catch (_) {}
    return (
      <div className="ad-unit" data-format="link">
        {tag}
        {href
          ? <a className="ad-link" href={href} target="_blank" rel="noreferrer noopener">
              <div className="ad-link-thumb"><Icon name="link" size={20} /></div>
              <div className="ad-body">
                <div className="ad-head">{ad.headline}</div>
                <div className="ad-sub">{host}</div>
              </div>
              <Icon name="external" size={16} />
            </a>
          : <div className="ad-body"><div className="ad-head">{ad.headline}</div></div>}
      </div>
    );
  }

  // text
  return (
    <div className="ad-unit" data-format="text">
      {tag}
      <div className="ad-body ad-textad">
        <div className="ad-head">{ad.headline}</div>
        {ad.body && <div className="ad-sub">{ad.body}</div>}
        {ctaBtn}
      </div>
    </div>
  );
}

export function AdSlot({ slotId }) {
  const [ad, setAd] = useState(undefined);
  useEffect(() => {
    let live = true;
    api.get(`/ads/live/${slotId}`)
      .then((d) => { if (live) setAd(d.ad); })
      .catch(() => { if (live) setAd(null); });
    return () => { live = false; };
  }, [slotId]);

  if (!ad) return null;
  return <div className="ad-slot"><AdUnit ad={ad} /></div>;
}
