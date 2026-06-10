import { useEffect, useState } from "react";
import Icon from "./Icon";
import { api } from "../lib/api";

export function AdUnit({ ad }) {
  const cta = ad.cta || "Learn more";
  const Wrap = ({ children }) => (
    <div className="ad-unit" data-format={ad.format}>
      <div className="ad-tag"><span className="ad-dot" />Sponsored{ad.company ? " · " + ad.company : ""}</div>
      {children}
    </div>
  );
  const ctaBtn = ad.url ? <a className="ad-cta" href={ad.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>{cta}<Icon name="external" size={14} /></a> : null;

  if (ad.format === "photo") {
    return <Wrap><div className="ad-photo">{ad.mediaSrc ? <img src={ad.mediaSrc} alt={ad.headline || ""} /> : <div className="nu-ph" style={{ background: "linear-gradient(135deg,#FFD27A,#FF8A3D)" }}><span className="nu-ph-stripes" /></div>}</div>
      <div className="ad-body"><div className="ad-head">{ad.headline}</div>{ad.body && <div className="ad-sub">{ad.body}</div>}{ctaBtn}</div></Wrap>;
  }
  if (ad.format === "video") {
    return <Wrap><div className="ad-photo">{ad.mediaSrc ? <video src={ad.mediaSrc} controls playsInline /> : <div className="nu-ph" style={{ background: "linear-gradient(135deg,#6FD0FF,#1B8BE0)" }}><span className="nu-ph-stripes" /></div>}</div>
      <div className="ad-body"><div className="ad-head">{ad.headline}</div>{ad.body && <div className="ad-sub">{ad.body}</div>}{ctaBtn}</div></Wrap>;
  }
  if (ad.format === "audio") {
    return <Wrap><div className="ad-audio"><div className="ad-audio-ic"><Icon name="audio" size={22} /></div><div className="ad-body"><div className="ad-head">{ad.headline}</div>{ad.mediaSrc && <audio src={ad.mediaSrc} controls />}{ctaBtn}</div></div></Wrap>;
  }
  if (ad.format === "link") {
    let host = ad.url;
    try { host = new URL(ad.url).hostname.replace(/^www\./, ""); } catch (e) {}
    return <Wrap><a className="ad-link" href={ad.url || "#"} target="_blank" rel="noreferrer"><div className="ad-link-thumb"><Icon name="link" size={20} /></div><div className="ad-body"><div className="ad-head">{ad.headline}</div><div className="ad-sub">{host}</div></div><Icon name="external" size={16} /></a></Wrap>;
  }
  return <Wrap><div className="ad-body ad-textad"><div className="ad-head">{ad.headline}</div>{ad.body && <div className="ad-sub">{ad.body}</div>}{ctaBtn}</div></Wrap>;
}

export function AdSlot({ slotId }) {
  const [ad, setAd] = useState(undefined);
  useEffect(() => {
    let live = true;
    api.get(`/ads/live/${slotId}`).then((d) => { if (live) setAd(d.ad); }).catch(() => { if (live) setAd(null); });
    return () => { live = false; };
  }, [slotId]);

  if (!ad) return null;
  return <div className="ad-slot"><AdUnit ad={ad} /></div>;
}
