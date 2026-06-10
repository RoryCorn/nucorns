import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import { AdUnit } from "../components/Ads";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

function AdNav({ admin }) {
  return (
    <header className="nu-nav">
      <div className="nu-nav-inner">
        <Link className="nu-wordmark" to="/"><img className="nu-logo-img" src="/nucorns-mark-circle.png" alt="" />nu<span>corns</span></Link>
        <div className="wr-navmid">Advertising</div>
        <div className="nu-nav-right">
          {admin && <span className="ad-adminbadge"><Icon name="lock" size={14} />Admin</span>}
          <Link className="nu-btn-ghost" to="/">Back to site</Link>
        </div>
      </div>
    </header>
  );
}

function InquiryForm() {
  const blank = { company: "", contact: "", what: "", timing: "" };
  const [d, setD] = useState(blank);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k, v) => setD((o) => ({ ...o, [k]: v }));
  const ok = d.company.trim() && d.contact.trim() && d.what.trim();

  async function submit() {
    if (!ok || busy) return;
    setErr(""); setBusy(true);
    try {
      await api.post("/ads/requests", {
        company: d.company.trim(),
        contact: d.contact.trim(),
        format: "text",
        headline: d.what.trim().slice(0, 70),
        body: d.what.trim(),
        url: "",
        cta: "Learn more",
        mediaSrc: null,
        preferredSlot: "home-1",
        note: d.timing.trim(),
      });
      setDone(true);
    } catch (e) {
      setErr(e.message || "Couldn't send your inquiry. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) return (
    <div className="ad-success">
      <div className="ad-success-ic"><Icon name="check" size={26} /></div>
      <h3>Inquiry received</h3>
      <p>Our team will reach out to <strong>{d.contact}</strong> to discuss pricing, available placements, and your preferred campaign start and end dates.</p>
      <button className="nu-btn-post" onClick={() => { setD(blank); setDone(false); }}>Submit another inquiry</button>
    </div>
  );

  return (
    <div className="ad-form">
      <div className="ad-field-row">
        <label className="ad-field">
          <span className="su-label">Company or brand name</span>
          <input className="su-input" value={d.company} onChange={(e) => set("company", e.target.value)} placeholder="e.g. Aperture Film Co." />
        </label>
        <label className="ad-field">
          <span className="su-label">Your email address</span>
          <input className="su-input" type="email" value={d.contact} onChange={(e) => set("contact", e.target.value)} placeholder="you@yourbrand.com" />
        </label>
      </div>

      <label className="ad-field">
        <span className="su-label">What are you advertising?</span>
        <textarea className="su-input su-textarea" rows={3} maxLength={400} value={d.what}
          onChange={(e) => set("what", e.target.value)}
          placeholder="Briefly describe your product, service, or campaign — what you want to promote and who it's for." />
      </label>

      <label className="ad-field">
        <span className="su-label">Preferred campaign timing (optional)</span>
        <input className="su-input" value={d.timing} onChange={(e) => set("timing", e.target.value)}
          placeholder="e.g. starting next month, 4-week run, specific dates, flexible — anything helps" />
      </label>

      {err && <span className="su-err"><Icon name="close" size={14} />{err}</span>}

      <button className="nu-btn-post ad-submit" disabled={!ok || busy} onClick={submit}>
        {busy ? <><span className="wr-spin" />Sending…</> : <>Send inquiry<Icon name="send" size={15} /></>}
      </button>
      <p className="ad-fineprint"><Icon name="lock" size={13} />Your inquiry goes directly to the nucorns team. We'll be in touch to discuss everything before anything goes live.</p>
    </div>
  );
}

function FormatFields({ d, set, formats, onPhoto, photoErr }) {
  return (
    <>
      <div className="ad-field">
        <span className="su-label">Format</span>
        <div className="ad-formats">
          {formats.map((f) => (
            <button key={f} type="button" className={"ad-fmt" + (d.format === f ? " is-on" : "")} onClick={() => set("format", f)}>
              <Icon name={f === "photo" ? "photo" : f === "video" ? "video" : f === "audio" ? "audio" : f === "link" ? "link" : "sparkle"} size={16} />{f}
            </button>
          ))}
        </div>
      </div>
      <label className="ad-field"><span className="su-label">Headline</span>
        <input className="su-input" maxLength={70} value={d.headline} onChange={(e) => set("headline", e.target.value)} placeholder="A short, honest hook" />
      </label>
      {(d.format === "text" || d.format === "photo" || d.format === "video" || d.format === "audio") && (
        <label className="ad-field"><span className="su-label">Body {d.format !== "text" ? "(optional)" : ""}</span>
          <textarea className="su-input su-textarea" rows={2} maxLength={160} value={d.body} onChange={(e) => set("body", e.target.value)} placeholder="One or two lines about the offer." />
        </label>
      )}
      {d.format === "photo" && (
        <div className="ad-field"><span className="su-label">Image</span>
          <div className="ad-uploadrow">
            <label className="su-upload"><Icon name="photo" size={18} />{d.mediaSrc ? "Replace image" : "Upload image"}
              <input type="file" accept="image/*" hidden onChange={(e) => { onPhoto(e.target.files[0]); e.target.value = ""; }} />
            </label>
            {d.mediaSrc && <img className="ad-thumb" src={d.mediaSrc} alt="" />}
          </div>
          {photoErr && <span className="su-err"><Icon name="close" size={14} />{photoErr}</span>}
        </div>
      )}
      {(d.format === "video" || d.format === "audio") && (
        <label className="ad-field"><span className="su-label">{d.format === "video" ? "Video" : "Audio"} URL</span>
          <input className="su-input" value={d.mediaSrc || ""} onChange={(e) => set("mediaSrc", e.target.value)} placeholder={"https://… ." + (d.format === "video" ? "mp4" : "mp3")} />
        </label>
      )}
      {(d.format === "link" || d.format === "photo" || d.format === "video" || d.format === "text" || d.format === "audio") && (
        <div className="ad-field-row">
          <label className="ad-field"><span className="su-label">Link URL {d.format === "link" ? "" : "(optional)"}</span>
            <input className="su-input" value={d.url} onChange={(e) => set("url", e.target.value)} placeholder="https://yourbrand.com" />
          </label>
          <label className="ad-field ad-field-sm"><span className="su-label">Button text</span>
            <input className="su-input" maxLength={22} value={d.cta} onChange={(e) => set("cta", e.target.value)} placeholder="Learn more" />
          </label>
        </div>
      )}
    </>
  );
}

function AdminCreate({ slots, formats, onCreated }) {
  const blank = { company: "", format: "photo", headline: "", body: "", url: "", cta: "Learn more", mediaSrc: null, slot: "home-1", live: true };
  const [d, setD] = useState(blank);
  const [photoErr, setPhotoErr] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setD((o) => ({ ...o, [k]: v }));

  async function onPhoto(f) {
    if (!f) return;
    setPhotoErr("");
    try { const r = await api.upload("/ads/media", f); set("mediaSrc", r.url); }
    catch (e) { setPhotoErr(e.message); }
  }
  const ok = d.company.trim() && d.headline.trim();

  async function create() {
    if (!ok || busy) return;
    setErr(""); setBusy(true);
    try {
      await api.post("/ads", { company: d.company.trim(), format: d.format, headline: d.headline.trim(), body: d.body.trim(), url: d.url.trim(), cta: d.cta.trim() || "Learn more", mediaSrc: d.mediaSrc, slot: d.slot, live: d.live });
      setD(blank); onCreated();
    } catch (e) { setErr(e.message || "Couldn't create that ad."); }
    finally { setBusy(false); }
  }

  return (
    <div className="ad-form">
      <label className="ad-field"><span className="su-label">Advertiser name</span>
        <input className="su-input" value={d.company} onChange={(e) => set("company", e.target.value)} placeholder="Brand running this ad" />
      </label>
      <FormatFields d={d} set={set} formats={formats} onPhoto={onPhoto} photoErr={photoErr} />
      <div className="ad-field-row">
        <label className="ad-field"><span className="su-label">Place in slot</span>
          <select className="su-input" value={d.slot} onChange={(e) => set("slot", e.target.value)}>
            {slots.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
        <label className="ad-field ad-field-sm ad-livetoggle"><span className="su-label">Run immediately</span>
          <button type="button" className={"ad-switch" + (d.live ? " on" : "")} onClick={() => set("live", !d.live)}><span /></button>
        </label>
      </div>
      {err && <span className="su-err"><Icon name="close" size={14} />{err}</span>}
      <div className="ad-preview-wrap"><span className="su-label">Live preview</span><AdUnit ad={d} /></div>
      <button className="nu-btn-post ad-submit" disabled={!ok || busy} onClick={create}>
        {busy ? <><span className="wr-spin" />Creating…</> : <><Icon name="plus" size={16} />Create & place ad</>}
      </button>
    </div>
  );
}

function AdminConsole({ slots, formats }) {
  const [tab, setTab] = useState("requests");
  const [ads, setAds] = useState([]);
  const [reqs, setReqs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    return Promise.all([api.get("/ads/requests"), api.get("/ads")])
      .then(([r, a]) => { setReqs(r.requests); setAds(a.ads); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function approve(r) { await api.post(`/ads/requests/${r.id}/approve`); load(); }
  async function reject(r) { await api.post(`/ads/requests/${r.id}/reject`); load(); }
  async function place(slotId, adId) { await api.patch(`/ads/${adId}`, { slot: slotId, live: true }); load(); }
  async function clearSlot(slotId) { await api.post(`/ads/slots/${slotId}/clear`); load(); }
  async function toggleLive(ad) { await api.patch(`/ads/${ad.id}`, { live: !ad.live }); load(); }
  async function removeAd(adId) { await api.del(`/ads/${adId}`); load(); }

  const pending = reqs.filter((r) => r.status === "pending");

  return (
    <div className="ad-admin">
      <div className="ad-admin-top">
        <div>
          <h2 className="ad-admin-h">Ad control center</h2>
          <p className="ad-admin-sub">Admin-only. Review inquiries and control exactly what runs in each slot.</p>
        </div>
      </div>

      <div className="ad-tabs">
        {[["requests", "Inquiries" + (pending.length ? " (" + pending.length + ")" : "")], ["placements", "Placements"], ["create", "Create ad"]].map(([id, label]) => (
          <button key={id} className={"ad-tab" + (tab === id ? " is-on" : "")} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === "requests" && (
        <div className="ad-reqs">
          {!loading && reqs.length === 0 && <div className="ad-empty">No inquiries yet.</div>}
          {reqs.map((r) => (
            <div className="ad-reqcard" key={r.id} data-status={r.status}>
              <div className="ad-reqcard-main">
                <div className="ad-reqcard-head"><strong>{r.company}</strong><span className={"ad-status ad-status-" + r.status}>{r.status}</span></div>
                <div className="ad-reqcard-hl">{r.headline}</div>
                {r.body && <div className="ad-reqcard-body">{r.body}</div>}
                <div className="ad-reqcard-meta">{r.contact}{r.note ? " · Timing: " + r.note : ""}</div>
              </div>
              {r.status === "pending" && (
                <div className="ad-reqcard-actions">
                  <button className="ad-approve" onClick={() => approve(r)}><Icon name="check" size={15} />Approve</button>
                  <button className="ad-reject" onClick={() => reject(r)}>Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "placements" && (
        <div className="ad-places">
          {slots.map((s) => {
            const live = ads.find((a) => a.slot === s.id && a.live);
            return (
              <div className="ad-place" key={s.id}>
                <div className="ad-place-head">
                  <div><strong>{s.label}</strong><span className="ad-place-note">{s.note}</span></div>
                  {live && <button className="ad-place-clear" onClick={() => clearSlot(s.id)}>Clear</button>}
                </div>
                <div className="ad-place-pick">
                  <select className="su-input" value={live ? live.id : ""} onChange={(e) => e.target.value ? place(s.id, e.target.value) : clearSlot(s.id)}>
                    <option value="">— No ad running —</option>
                    {ads.map((a) => <option key={a.id} value={a.id}>{a.company} · {a.headline || a.format}</option>)}
                  </select>
                </div>
                {live ? <div className="ad-place-preview"><AdUnit ad={live} /></div> : <div className="ad-place-empty">Nothing running in this slot.</div>}
              </div>
            );
          })}
          <div className="ad-inventory">
            <h4>All ads ({ads.length})</h4>
            {ads.map((a) => (
              <div className="ad-invrow" key={a.id}>
                <span className="ad-chip">{a.format}</span>
                <span className="ad-invrow-tx"><strong>{a.company}</strong> — {a.headline || "(no headline)"}</span>
                <span className={"ad-invrow-live" + (a.live ? " on" : "")}>{a.live ? "live · " + ((slots.find((s) => s.id === a.slot) || {}).label || a.slot) : "paused"}</span>
                <button className="ad-invrow-btn" onClick={() => toggleLive(a)}>{a.live ? "Pause" : "Run"}</button>
                <button className="ad-invrow-btn ad-del" onClick={() => removeAd(a.id)}><Icon name="close" size={14} /></button>
              </div>
            ))}
            {ads.length === 0 && <div className="ad-empty">No ads yet — approve an inquiry or create one directly.</div>}
          </div>
        </div>
      )}

      {tab === "create" && <AdminCreate slots={slots} formats={formats} onCreated={() => { load(); setTab("placements"); }} />}
    </div>
  );
}

export default function AdvertisingPage() {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [formats, setFormats] = useState([]);

  useEffect(() => {
    api.get("/ads/slots").then((d) => { setSlots(d.slots || []); setFormats(d.formats || []); }).catch(() => {});
  }, []);

  const isAdmin = !!(user && user.isAdmin);

  return (
    <div className="nu-root">
      <AdNav admin={isAdmin} />
      <main className="ad-main">
        {!isAdmin && (
          <>
            <section className="ad-hero">
              <span className="ad-hero-tag"><Icon name="megaphone" size={14} />Advertise with nucorns</span>
              <h1>Reach an audience of creators, makers, and storytellers.</h1>
              <p>nucorns is a community of photographers, writers, and builders with engaged, curious readers. Send us an inquiry and our team will personally reach out to discuss pricing, placement, and the start and end dates that work for your campaign.</p>
            </section>

            <section className="ad-cols">
              <div className="ad-card">
                <h2 className="ad-card-h">Get in touch</h2>
                <p className="ad-card-sub">Fill in the form below and a member of the nucorns team will contact you to discuss everything — no commitment required.</p>
                <InquiryForm />
              </div>
              <aside className="ad-aside">
                <h3>How it works</h3>
                <ol className="ad-steps">
                  <li><strong>Send an inquiry</strong> — tell us about your brand and what you want to promote.</li>
                  <li><strong>We reach out</strong> — our team contacts you to discuss pricing and the details of your campaign.</li>
                  <li><strong>Agree on a schedule</strong> — we confirm your campaign start date, end date, and placement together.</li>
                  <li><strong>Go live</strong> — your ad is placed by our admin and runs exactly as agreed.</li>
                </ol>
                <div className="ad-aside-where">
                  <h4>Where ads appear</h4>
                  <div className="ad-aside-slot"><Icon name="check" size={14} /><div><strong>Homepage sidebar — top</strong>Seen by every visitor to nucorns.com</div></div>
                  <div className="ad-aside-slot"><Icon name="check" size={14} /><div><strong>Homepage sidebar — bottom</strong>A second placement below the first</div></div>
                </div>
              </aside>
            </section>
          </>
        )}

        {isAdmin && <AdminConsole slots={slots} formats={formats} />}

        <footer className="nu-foot">made with <span className="nu-foot-mark">nucorns</span> · advertising that respects the room ✦</footer>
      </main>
    </div>
  );
}
