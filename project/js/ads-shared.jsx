// nucorns — advertising shared layer: storage, admin auth, AdUnit + AdSlot.
const NU_AD_SLOTS = [
  { id: "convo", label: "Conversation — in-thread", note: "Inside article discussions" },
  { id: "feed", label: "Profile — story feed", note: "Between stories on creator pages" },
  { id: "story", label: "Story footer", note: "Below a published story" },
];
const NU_AD_FORMATS = ["photo", "video", "audio", "text", "link"];
const NU_ADMIN_KEY = "nucorns2026"; // demo admin passcode

function nuLoadAds() { try { return JSON.parse(localStorage.getItem("nucorns_ads") || "[]"); } catch (e) { return []; } }
function nuSaveAds(a) { try { localStorage.setItem("nucorns_ads", JSON.stringify(a)); } catch (e) {} }
function nuLoadAdReqs() { try { return JSON.parse(localStorage.getItem("nucorns_ad_requests") || "[]"); } catch (e) { return []; } }
function nuSaveAdReqs(a) { try { localStorage.setItem("nucorns_ad_requests", JSON.stringify(a)); } catch (e) {} }
function nuIsAdmin() { return localStorage.getItem("nucorns_admin") === "1"; }
function nuSetAdmin(v) { if (v) localStorage.setItem("nucorns_admin", "1"); else localStorage.removeItem("nucorns_admin"); }

/* ---------- AdUnit: renders a single ad by format ---------- */
function AdUnit({ ad, onClick }) {
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
    return <Wrap><a className="ad-link" href={ad.url || "#"} target="_blank" rel="noreferrer"><div className="ad-link-thumb"><Icon name="link" size={20} /></div><div className="ad-body"><div className="ad-head">{ad.headline}</div><div className="ad-sub">{(function () { try { return new URL(ad.url).hostname.replace(/^www\./, ""); } catch (e) { return ad.url; } })()}</div></div><Icon name="external" size={16} /></a></Wrap>;
  }
  // text
  return <Wrap><div className="ad-body ad-textad"><div className="ad-head">{ad.headline}</div>{ad.body && <div className="ad-sub">{ad.body}</div>}{ctaBtn}</div></Wrap>;
}

/* ---------- AdSlot: shows the live ad placed in a slot, else a house promo ---------- */
function AdSlot({ slotId, house = true }) {
  const ad = nuLoadAds().find((a) => a.slot === slotId && a.live);
  if (ad) return <div className="ad-slot"><AdUnit ad={ad} /></div>;
  if (!house) return null;
  return (
    <a className="ad-house" href="nucorns — Advertising.html">
      <div className="ad-house-ic"><Icon name="megaphone" size={20} /></div>
      <div className="ad-house-tx"><strong>Your brand here</strong>Reach nucorns creators — advertise with us</div>
      <Icon name="chevron" size={18} />
    </a>
  );
}

Object.assign(window, { NU_AD_SLOTS, NU_AD_FORMATS, NU_ADMIN_KEY, nuLoadAds, nuSaveAds, nuLoadAdReqs, nuSaveAdReqs, nuIsAdmin, nuSetAdmin, AdUnit, AdSlot });
