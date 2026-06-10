import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Icon from "../components/Icon";
import { api } from "../lib/api";
import logo from "/nucorns-mark-circle.png";

const FORMATS = [
  { id: "photo", icon: "photo", label: "Photo" },
  { id: "video", icon: "video", label: "Video" },
  { id: "audio", icon: "audio", label: "Audio" },
  { id: "text", icon: "sparkle", label: "Text" },
  { id: "link", icon: "link", label: "Link" },
];

export default function CreativeSubmitPage() {
  const { token } = useParams();
  const [state, setState] = useState("loading"); // loading | form | done | invalid | already
  const [company, setCompany] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadErr, setUploadErr] = useState("");

  const blank = { format: "photo", headline: "", body: "", url: "", cta: "Learn more", mediaSrc: null };
  const [d, setD] = useState(blank);
  const set = (k, v) => setD((o) => ({ ...o, [k]: v }));

  useEffect(() => {
    api.get(`/ads/creative/${token}`)
      .then((data) => {
        if (data.alreadySubmitted) { setCompany(data.company); setState("already"); return; }
        setCompany(data.company);
        setState("form");
      })
      .catch(() => setState("invalid"));
  }, [token]);

  async function uploadPhoto(file) {
    if (!file) return;
    setUploadErr(""); setUploadBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("token", token);
      const res = await fetch("/api/ads/media/public", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      set("mediaSrc", json.url);
    } catch (e) {
      setUploadErr(e.message);
    } finally {
      setUploadBusy(false);
    }
  }

  async function submit() {
    const headline = d.headline.trim();
    if (!headline || busy) return;
    setErr(""); setBusy(true);
    try {
      await api.post(`/ads/creative/${token}`, {
        format: d.format, headline, body: d.body.trim(),
        url: d.url.trim(), cta: d.cta.trim() || "Learn more",
        mediaSrc: d.mediaSrc,
      });
      setState("done");
    } catch (e) {
      setErr(e.message || "Couldn't submit your creative. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = d.headline.trim() && !busy;

  if (state === "loading") return (
    <div className="cr-shell">
      <div className="cr-loading"><span className="wr-spin" style={{ width: 28, height: 28, borderWidth: 3 }} /></div>
    </div>
  );

  if (state === "invalid") return (
    <div className="cr-shell">
      <div className="cr-card cr-state">
        <div className="cr-state-ic" style={{ background: "color-mix(in oklab, var(--danger) 12%, white)", color: "var(--danger-deep)" }}><Icon name="close" size={26} /></div>
        <h2>Link not found</h2>
        <p>This link is invalid, expired, or has already been used. If you think this is an error, contact us at <a href="mailto:rcorn88@gmail.com">rcorn88@gmail.com</a>.</p>
        <Link className="nu-btn-post" to="/">Go to nucorns</Link>
      </div>
    </div>
  );

  if (state === "already") return (
    <div className="cr-shell">
      <div className="cr-card cr-state">
        <div className="cr-state-ic"><Icon name="check" size={26} /></div>
        <h2>Already submitted</h2>
        <p>We've already received the creative for <strong>{company}</strong>. The nucorns team will be in touch once your ad is live.</p>
        <Link className="nu-btn-post" to="/">Go to nucorns</Link>
      </div>
    </div>
  );

  if (state === "done") return (
    <div className="cr-shell">
      <div className="cr-card cr-state">
        <div className="cr-state-ic"><Icon name="check" size={26} /></div>
        <h2>Creative received!</h2>
        <p>Thanks, <strong>{company}</strong>. Your ad creative has been submitted. The nucorns team will review it and place your ad — we'll reach out if we need anything.</p>
        <Link className="nu-btn-post" to="/">Visit nucorns</Link>
      </div>
    </div>
  );

  return (
    <div className="cr-shell">
      <header className="cr-header">
        <Link to="/"><img className="cr-logo" src={logo} alt="nucorns" /></Link>
        <span className="cr-header-label">Ad Creative Submission</span>
      </header>

      <div className="cr-card">
        <div className="cr-intro">
          <h1>Submit your ad creative</h1>
          <p>Hi <strong>{company}</strong> — your inquiry has been approved. Fill in your ad details below and we'll place it on nucorns once reviewed.</p>
        </div>

        {/* Format picker */}
        <div className="cr-field">
          <span className="su-label">Ad format</span>
          <div className="ad-formats">
            {FORMATS.map((f) => (
              <button key={f.id} type="button"
                className={"ad-fmt" + (d.format === f.id ? " is-on" : "")}
                onClick={() => { set("format", f.id); set("mediaSrc", null); }}>
                <Icon name={f.icon} size={16} />{f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Headline */}
        <label className="cr-field">
          <span className="su-label">Headline <span className="cr-req">required</span></span>
          <input className="su-input" maxLength={70} value={d.headline}
            onChange={(e) => set("headline", e.target.value)}
            placeholder="A short, clear headline for your ad" />
          <span className="cr-hint">{d.headline.length}/70</span>
        </label>

        {/* Body (all except link-only) */}
        {d.format !== "link" && (
          <label className="cr-field">
            <span className="su-label">Description <span className="cr-opt">optional</span></span>
            <textarea className="su-input su-textarea" rows={2} maxLength={160} value={d.body}
              onChange={(e) => set("body", e.target.value)}
              placeholder="One or two lines about what you're promoting." />
            <span className="cr-hint">{d.body.length}/160</span>
          </label>
        )}

        {/* Image upload */}
        {d.format === "photo" && (
          <div className="cr-field">
            <span className="su-label">Image <span className="cr-opt">optional</span></span>
            <div className="ad-uploadrow">
              <label className={"su-upload" + (uploadBusy ? " is-busy" : "")}>
                {uploadBusy ? <><span className="wr-spin" />Uploading…</> : <><Icon name="photo" size={18} />{d.mediaSrc ? "Replace image" : "Upload image"}</>}
                <input type="file" accept="image/*" hidden disabled={uploadBusy}
                  onChange={(e) => { uploadPhoto(e.target.files[0]); e.target.value = ""; }} />
              </label>
              {d.mediaSrc && <img className="ad-thumb" src={d.mediaSrc} alt="" />}
            </div>
            {uploadErr && <span className="su-err"><Icon name="close" size={14} />{uploadErr}</span>}
          </div>
        )}

        {/* Video / audio URL */}
        {(d.format === "video" || d.format === "audio") && (
          <label className="cr-field">
            <span className="su-label">{d.format === "video" ? "Video" : "Audio"} URL <span className="cr-opt">optional</span></span>
            <input className="su-input" value={d.mediaSrc || ""}
              onChange={(e) => set("mediaSrc", e.target.value)}
              placeholder={`https://… .${d.format === "video" ? "mp4" : "mp3"}`} />
          </label>
        )}

        {/* Link URL + CTA */}
        <div className="cr-field-row">
          <label className="cr-field">
            <span className="su-label">
              Destination URL {d.format === "link" ? <span className="cr-req">required</span> : <span className="cr-opt">optional</span>}
            </span>
            <input className="su-input" value={d.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://yourbrand.com/landing-page" />
          </label>
          <label className="cr-field cr-field-sm">
            <span className="su-label">Button label</span>
            <input className="su-input" maxLength={22} value={d.cta}
              onChange={(e) => set("cta", e.target.value)}
              placeholder="Learn more" />
          </label>
        </div>

        {err && <span className="su-err"><Icon name="close" size={14} />{err}</span>}

        <button className="nu-btn-post cr-submit" disabled={!canSubmit} onClick={submit}>
          {busy ? <><span className="wr-spin" />Submitting…</> : <>Submit creative<Icon name="send" size={15} /></>}
        </button>

        <p className="ad-fineprint">
          <Icon name="lock" size={13} />
          Once submitted, the nucorns team will review your creative and place your ad. We'll reach out if anything needs adjusting.
        </p>
      </div>
    </div>
  );
}
