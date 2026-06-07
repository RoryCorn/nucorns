// nucorns — Advertising hub. Companies submit ad requests; admin-only console
// reviews requests and controls placement across slots (photo/video/audio/text/link).
const { useState } = React;

function AdNav({ admin, onToggleAdmin }) {
  return (
    <header className="nu-nav">
      <div className="nu-nav-inner">
        <a className="nu-wordmark" href="nucorns — Profile.html"><img className="nu-logo-img" src="assets/nucorns-mark-circle.png" alt="" />nu<span>corns</span></a>
        <div className="wr-navmid">Advertising</div>
        <div className="nu-nav-right">
          {admin && <span className="ad-adminbadge"><Icon name="lock" size={14} />Admin</span>}
          <a className="nu-btn-ghost" href="nucorns — Profile.html">Back to site</a>
        </div>
      </div>
    </header>
  );
}

/* format-specific fields, shared by company form + admin create */
function FormatFields({ d, set, onPhoto, photoErr }) {
  return (
    <>
      <div className="ad-field">
        <span className="su-label">Format</span>
        <div className="ad-formats">
          {NU_AD_FORMATS.map((f) => (
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

/* ---------------- Company submission ---------------- */
function CompanyForm() {
  const blank = { company: "", contact: "", format: "photo", headline: "", body: "", url: "", cta: "Learn more", mediaSrc: null, preferredSlot: "convo", note: "" };
  const [d, setD] = useState(blank);
  const [photoErr, setPhotoErr] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k, v) => setD((o) => ({ ...o, [k]: v }));

  async function onPhoto(f) {
    if (!f) return; setPhotoErr("");
    const r = await moderateImageFile(f, { maxDim: 900 });
    if (r.status === "blocked") { setPhotoErr(r.reason); return; }
    set("mediaSrc", r.dataUrl);
  }
  const ok = d.company.trim() && d.contact.trim() && d.headline.trim();

  async function submit() {
    if (!ok || busy) return;
    setErr(""); setBusy(true);
    const res = await moderateText([d.company, d.headline, d.body, d.note].filter(Boolean).join("\n"));
    setBusy(false);
    if (res.status === "blocked") { setErr(res.reason); return; }
    const reqs = nuLoadAdReqs();
    reqs.unshift({ id: "r" + Date.now(), status: "pending", ts: Date.now(),
      company: d.company.trim(), contact: d.contact.trim(), format: d.format, headline: d.headline.trim(),
      body: d.body.trim(), url: d.url.trim(), cta: d.cta.trim() || "Learn more", mediaSrc: d.mediaSrc, preferredSlot: d.preferredSlot, note: d.note.trim() });
    nuSaveAdReqs(reqs);
    setDone(true);
  }

  if (done) return (
    <div className="ad-success">
      <div className="ad-success-ic"><Icon name="check" size={26} /></div>
      <h3>Request sent to the nucorns team</h3>
      <p>We review every submission against our community guidelines. You'll hear back at <strong>{d.contact}</strong>. Placement is set by our admin once approved.</p>
      <button className="nu-btn-post" onClick={() => { setD(blank); setDone(false); }}>Submit another</button>
    </div>
  );

  return (
    <div className="ad-form">
      <div className="ad-field-row">
        <label className="ad-field"><span className="su-label">Company / brand</span>
          <input className="su-input" value={d.company} onChange={(e) => set("company", e.target.value)} placeholder="e.g. Aperture Film Co." />
        </label>
        <label className="ad-field"><span className="su-label">Contact email</span>
          <input className="su-input" value={d.contact} onChange={(e) => set("contact", e.target.value)} placeholder="you@brand.com" />
        </label>
      </div>

      <FormatFields d={d} set={set} onPhoto={onPhoto} photoErr={photoErr} />

      <div className="ad-field-row">
        <label className="ad-field"><span className="su-label">Preferred placement</span>
          <select className="su-input" value={d.preferredSlot} onChange={(e) => set("preferredSlot", e.target.value)}>
            {NU_AD_SLOTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
        <label className="ad-field"><span className="su-label">Note to admin (optional)</span>
          <input className="su-input" value={d.note} onChange={(e) => set("note", e.target.value)} placeholder="Budget, timing, anything else" />
        </label>
      </div>

      {err && <span className="su-err"><Icon name="close" size={14} />{err}</span>}

      <div className="ad-preview-wrap">
        <span className="su-label">Live preview</span>
        <AdUnit ad={d} />
      </div>

      <button className="nu-btn-post ad-submit" disabled={!ok || busy} onClick={submit}>
        {busy ? <><span className="wr-spin" />Checking…</> : <>Send to nucorns<Icon name="send" size={15} /></>}
      </button>
      <p className="ad-fineprint"><Icon name="lock" size={13} />Only the nucorns admin can place ads on the site. Submissions are reviewed for nudity, hate & harassment.</p>
    </div>
  );
}

/* ---------------- Admin console ---------------- */
function AdminConsole({ onSignOut }) {
  const [tab, setTab] = useState("requests");
  const [ads, setAds] = useState(() => nuLoadAds());
  const [reqs, setReqs] = useState(() => nuLoadAdReqs());
  const persistAds = (a) => { setAds(a); nuSaveAds(a); };
  const persistReqs = (r) => { setReqs(r); nuSaveAdReqs(r); };

  function approve(r) {
    const ad = { id: "a" + Date.now(), company: r.company, format: r.format, headline: r.headline, body: r.body, url: r.url, cta: r.cta, mediaSrc: r.mediaSrc, slot: r.preferredSlot || "convo", live: false, ts: Date.now() };
    persistAds([ad, ...ads]);
    persistReqs(reqs.map((x) => x.id === r.id ? { ...x, status: "approved" } : x));
  }
  function reject(r) { persistReqs(reqs.map((x) => x.id === r.id ? { ...x, status: "rejected" } : x)); }
  function place(slotId, adId) {
    persistAds(ads.map((a) => a.slot === slotId ? { ...a, live: a.id === adId } : (a.id === adId ? { ...a, slot: slotId, live: true } : a)));
  }
  function clearSlot(slotId) { persistAds(ads.map((a) => a.slot === slotId ? { ...a, live: false } : a)); }
  function toggleLive(adId) {
    persistAds(ads.map((a) => {
      if (a.id !== adId) return a;
      if (!a.live) return { ...a, live: true };
      return { ...a, live: false };
    }));
  }
  function removeAd(adId) { persistAds(ads.filter((a) => a.id !== adId)); }

  const pending = reqs.filter((r) => r.status === "pending");

  return (
    <div className="ad-admin">
      <div className="ad-admin-top">
        <div>
          <h2 className="ad-admin-h">Ad control center</h2>
          <p className="ad-admin-sub">Admin-only. Review brand requests and control exactly what runs in each slot.</p>
        </div>
        <button className="nu-btn-ghost" onClick={onSignOut}><Icon name="lock" size={15} />Sign out</button>
      </div>

      <div className="ad-tabs">
        {[["requests", "Requests" + (pending.length ? " (" + pending.length + ")" : "")], ["placements", "Placements"], ["create", "Create ad"]].map(([id, label]) => (
          <button key={id} className={"ad-tab" + (tab === id ? " is-on" : "")} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === "requests" && (
        <div className="ad-reqs">
          {reqs.length === 0 && <div className="ad-empty">No brand requests yet. Share the advertising page with companies.</div>}
          {reqs.map((r) => (
            <div className="ad-reqcard" key={r.id} data-status={r.status}>
              <div className="ad-reqcard-main">
                <div className="ad-reqcard-head"><strong>{r.company}</strong><span className="ad-chip">{r.format}</span><span className={"ad-status ad-status-" + r.status}>{r.status}</span></div>
                <div className="ad-reqcard-hl">{r.headline}</div>
                {r.body && <div className="ad-reqcard-body">{r.body}</div>}
                <div className="ad-reqcard-meta">{r.contact} · wants {NU_AD_SLOTS.find((s) => s.id === r.preferredSlot)?.label}{r.note ? " · " + r.note : ""}</div>
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
          {NU_AD_SLOTS.map((s) => {
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
                <span className={"ad-invrow-live" + (a.live ? " on" : "")}>{a.live ? "live · " + (NU_AD_SLOTS.find((s) => s.id === a.slot)?.label || a.slot) : "paused"}</span>
                <button className="ad-invrow-btn" onClick={() => toggleLive(a.id)}>{a.live ? "Pause" : "Run"}</button>
                <button className="ad-invrow-btn ad-del" onClick={() => removeAd(a.id)}><Icon name="close" size={14} /></button>
              </div>
            ))}
            {ads.length === 0 && <div className="ad-empty">No ads yet — approve a request or create one.</div>}
          </div>
        </div>
      )}

      {tab === "create" && <AdminCreate onCreate={(ad) => { persistAds([ad, ...ads]); setTab("placements"); }} />}
    </div>
  );
}

function AdminCreate({ onCreate }) {
  const blank = { company: "", format: "photo", headline: "", body: "", url: "", cta: "Learn more", mediaSrc: null, slot: "convo", live: true };
  const [d, setD] = useState(blank);
  const [photoErr, setPhotoErr] = useState("");
  const set = (k, v) => setD((o) => ({ ...o, [k]: v }));
  async function onPhoto(f) { if (!f) return; setPhotoErr(""); const r = await moderateImageFile(f, { maxDim: 900 }); if (r.status === "blocked") { setPhotoErr(r.reason); return; } set("mediaSrc", r.dataUrl); }
  const ok = d.company.trim() && d.headline.trim();
  function create() {
    if (!ok) return;
    onCreate({ id: "a" + Date.now(), company: d.company.trim(), format: d.format, headline: d.headline.trim(), body: d.body.trim(), url: d.url.trim(), cta: d.cta.trim() || "Learn more", mediaSrc: d.mediaSrc, slot: d.slot, live: d.live, ts: Date.now() });
  }
  return (
    <div className="ad-form">
      <label className="ad-field"><span className="su-label">Advertiser name</span>
        <input className="su-input" value={d.company} onChange={(e) => set("company", e.target.value)} placeholder="Brand running this ad" />
      </label>
      <FormatFields d={d} set={set} onPhoto={onPhoto} photoErr={photoErr} />
      <div className="ad-field-row">
        <label className="ad-field"><span className="su-label">Place in slot</span>
          <select className="su-input" value={d.slot} onChange={(e) => set("slot", e.target.value)}>
            {NU_AD_SLOTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
        <label className="ad-field ad-field-sm ad-livetoggle"><span className="su-label">Run immediately</span>
          <button type="button" className={"ad-switch" + (d.live ? " on" : "")} onClick={() => set("live", !d.live)}><span /></button>
        </label>
      </div>
      <div className="ad-preview-wrap"><span className="su-label">Live preview</span><AdUnit ad={d} /></div>
      <button className="nu-btn-post ad-submit" disabled={!ok} onClick={create}><Icon name="plus" size={16} />Create & place ad</button>
    </div>
  );
}

/* ---------------- Admin gate ---------------- */
function AdminGate({ onUnlock }) {
  const [key, setKey] = useState("");
  const [bad, setBad] = useState(false);
  function tryUnlock() { if (key.trim() === NU_ADMIN_KEY) { nuSetAdmin(true); onUnlock(); } else setBad(true); }
  return (
    <div className="ad-gate">
      <div className="ad-gate-ic"><Icon name="lock" size={20} /></div>
      <div className="ad-gate-tx"><strong>Admin access</strong>Placement controls are restricted to the nucorns admin.</div>
      <input className={"su-input ad-gate-in" + (bad ? " is-bad" : "")} type="password" value={key}
        onChange={(e) => { setKey(e.target.value); setBad(false); }} onKeyDown={(e) => e.key === "Enter" && tryUnlock()} placeholder="Admin passcode" />
      <button className="nu-btn-post" onClick={tryUnlock}>Unlock</button>
      <span className="ad-gate-hint">Demo passcode: <code>nucorns2026</code></span>
    </div>
  );
}

/* ---------------- App ---------------- */
function App() {
  const [admin, setAdmin] = useState(() => nuIsAdmin());
  return (
    <div className="nu-root" data-direction="playful" data-density="cozy">
      <AdNav admin={admin} />
      <main className="ad-main">
        {!admin && (
          <>
            <section className="ad-hero">
              <span className="ad-hero-tag"><Icon name="megaphone" size={14} />Advertise with nucorns</span>
              <h1>Put your brand in front of people who make things.</h1>
              <p>nucorns creators shoot, write, and build for engaged audiences. Submit an ad and our team places it where it fits — photo, video, audio, text, or link.</p>
              <div className="ad-hero-stats">
                <span><strong>5</strong> placement slots</span>
                <span><strong>5</strong> media formats</span>
                <span><strong>100%</strong> human-reviewed</span>
              </div>
            </section>

            <section className="ad-cols">
              <div className="ad-card">
                <h2 className="ad-card-h">Submit your ad</h2>
                <CompanyForm />
              </div>
              <aside className="ad-aside">
                <h3>How it works</h3>
                <ol className="ad-steps">
                  <li><strong>Submit</strong> your creative and pick a preferred placement.</li>
                  <li><strong>We review</strong> it against community guidelines — no nudity, hate, or harassment.</li>
                  <li><strong>Admin places</strong> approved ads into live slots and controls timing.</li>
                </ol>
                <div className="ad-aside-where">
                  <h4>Where ads appear</h4>
                  {NU_AD_SLOTS.map((s) => <div className="ad-aside-slot" key={s.id}><Icon name="check" size={14} /><div><strong>{s.label}</strong>{s.note}</div></div>)}
                </div>
                <AdminGate onUnlock={() => setAdmin(true)} />
              </aside>
            </section>
          </>
        )}

        {admin && <AdminConsole onSignOut={() => { nuSetAdmin(false); setAdmin(false); }} />}

        <footer className="nu-foot">made with <span className="nu-foot-mark">nucorns</span> · advertising that respects the room ✦</footer>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
