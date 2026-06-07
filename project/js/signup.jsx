// nucorns — signup / profile-creation flow with a live preview.
const { useState, useRef, useMemo } = React;

const AV_PRESETS = [
  ["#FFB24D", "#FF6A1A"], ["#6FD0FF", "#1B8BE0"], ["#9BE7C4", "#2BB673"],
  ["#C9B6FF", "#7A5AF0"], ["#FF9EC4", "#F0568F"], ["#FFD27A", "#FF8A3D"],
];
const BN_PRESETS = [
  ["#FFCB7A", "#FF7A1A", "#1FA8F0"], ["#6FD0FF", "#1B8BE0", "#7A5AF0"],
  ["#9BE7C4", "#2BB673", "#1FA8F0"], ["#C9B6FF", "#7A5AF0", "#F0568F"],
  ["#FFD27A", "#FF8A3D", "#F0568F"],
];
const TAKEN = ["maya", "mayamakes", "admin", "nucorns", "you", "test", "support"];

const STEPS = ["Identity", "Look", "About you", "Interests", "Ready"];

function Field({ label, hint, children }) {
  return (
    <label className="su-field">
      <span className="su-label">{label}</span>
      {children}
      {hint && <span className="su-hint">{hint}</span>}
    </label>
  );
}

function App() {
  const [step, setStep] = useState(0);
  const [p, setP] = useState({
    name: "", handle: "", bio: "", interests: [],
    avatarGrad: AV_PRESETS[1], bannerGrad: BN_PRESETS[0], avatarSrc: null,
  });
  const fileRef = useRef(null);
  const set = (k, v) => setP((o) => ({ ...o, [k]: v }));
  const [avatarErr, setAvatarErr] = useState("");
  const [stepErr, setStepErr] = useState("");
  const [checking, setChecking] = useState(false);

  const handleClean = p.handle.toLowerCase().replace(/[^a-z0-9_]/g, "");
  const handleState = useMemo(() => {
    if (!handleClean) return { ok: false, msg: "" };
    if (handleClean.length < 3) return { ok: false, msg: "At least 3 characters" };
    if (TAKEN.includes(handleClean)) return { ok: false, msg: "That handle is taken", taken: true };
    return { ok: true, msg: "Available" };
  }, [handleClean]);

  const canNext = [
    p.name.trim().length >= 2 && handleState.ok,
    true,
    true,
    p.interests.length >= 3,
    true,
  ][step];

  function toggleInterest(i) {
    set("interests", p.interests.includes(i) ? p.interests.filter((x) => x !== i) : [...p.interests, i]);
  }

  async function onAvatarFile(f) {
    if (!f) return;
    setAvatarErr("");
    const r = await moderateImageFile(f, { maxDim: 320 });
    if (r.status === "blocked") { setAvatarErr(r.reason); return; }
    set("avatarSrc", r.dataUrl);
  }

  function finish() {
    nuSaveProfile({
      name: p.name.trim(), handle: handleClean, bio: p.bio.trim(),
      interests: p.interests, avatarGrad: p.avatarGrad, bannerGrad: p.bannerGrad,
      avatarSrc: p.avatarSrc || null,
    });
    window.location.href = "nucorns — Profile.html";
  }

  async function next() {
    setStepErr("");
    if (step === 0) {
      setChecking(true);
      const r = await moderateText(p.name);
      setChecking(false);
      if (r.status === "blocked") { setStepErr(r.reason); return; }
    }
    if (step === 2 && p.bio.trim()) {
      setChecking(true);
      const r = await moderateText(p.bio);
      setChecking(false);
      if (r.status === "blocked") { setStepErr(r.reason); return; }
    }
    if (step < STEPS.length - 1) setStep(step + 1); else finish();
  }
  function back() { if (step > 0) { setStepErr(""); setStep(step - 1); } }

  return (
    <div className="su-root">
      <div className="su-shell">
        {/* form column */}
        <div className="su-form">
          <div className="su-top">
            <a className="nu-wordmark" href="nucorns — Profile.html"><img className="nu-logo-img" src="assets/nucorns-mark-circle.png" alt="" />nu<span>corns</span></a>
            <span className="su-stepcount">Step {step + 1} of {STEPS.length}</span>
          </div>
          <div className="su-progress">
            {STEPS.map((s, i) => <span key={i} className={"su-prog-seg" + (i <= step ? " is-done" : "")} />)}
          </div>

          <div className="su-stepwrap" key={step}>
            {step === 0 && (
              <div className="su-step">
                <h1 className="su-h1">Claim your corner</h1>
                <p className="su-sub">Your handle is how readers find and tag you. Choose carefully — it's yours.</p>
                <Field label="Display name">
                  <input className="su-input" value={p.name} maxLength={40} placeholder="e.g. Maya Okafor"
                    onChange={(e) => set("name", e.target.value)} autoFocus />
                </Field>
                <Field label="Handle" hint={handleClean ? handleState.msg : "Letters, numbers & underscores"}>
                  <div className={"su-handle" + (handleClean ? (handleState.ok ? " is-ok" : " is-bad") : "")}>
                    <span>@</span>
                    <input value={p.handle} maxLength={20} placeholder="yourhandle"
                      onChange={(e) => set("handle", e.target.value)} />
                    {handleClean && (handleState.ok
                      ? <Icon name="check" size={18} />
                      : handleState.taken ? <Icon name="close" size={18} /> : null)}
                  </div>
                </Field>
              </div>
            )}

            {step === 1 && (
              <div className="su-step">
                <h1 className="su-h1">Make it yours</h1>
                <p className="su-sub">Pick a vibe now — you can upload real photos anytime later.</p>
                <Field label="Avatar">
                  <div className="su-swatches">
                    <button className="su-upload" onClick={() => fileRef.current.click()}>
                      <Icon name="photo" size={18} />Upload
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onAvatarFile(e.target.files[0])} />
                    {AV_PRESETS.map((g, i) => (
                      <button key={i} className={"su-swatch" + (!p.avatarSrc && p.avatarGrad === g ? " is-on" : "")}
                        style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})` }}
                        onClick={() => { set("avatarGrad", g); set("avatarSrc", null); }} />
                    ))}
                  </div>
                </Field>
                {avatarErr && <span className="su-err"><Icon name="close" size={14} />{avatarErr}</span>}
                <Field label="Banner">
                  <div className="su-swatches">
                    {BN_PRESETS.map((g, i) => (
                      <button key={i} className={"su-swatch su-swatch-wide" + (p.bannerGrad === g ? " is-on" : "")}
                        style={{ background: `linear-gradient(120deg, ${g[0]}, ${g[1]} 55%, ${g[2]})` }}
                        onClick={() => set("bannerGrad", g)} />
                    ))}
                  </div>
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="su-step">
                <h1 className="su-h1">Tell readers who you are</h1>
                <p className="su-sub">One or two lines. What do you make, and what's it about?</p>
                <Field label="Short bio" hint={(160 - p.bio.length) + " characters left"}>
                  <textarea className="su-input su-textarea" value={p.bio} maxLength={160} rows={4}
                    placeholder="Photographer chasing soft light. 30-day challenges & honest gear talk."
                    onChange={(e) => set("bio", e.target.value)} autoFocus />
                </Field>
              </div>
            )}

            {step === 3 && (
              <div className="su-step">
                <h1 className="su-h1">What are you into?</h1>
                <p className="su-sub">Pick at least 3. We'll use these to suggest creators and tag your work.</p>
                <div className="su-chips">
                  {NU_INTERESTS.map((i) => (
                    <button key={i} className={"su-chip" + (p.interests.includes(i) ? " is-on" : "")} onClick={() => toggleInterest(i)}>
                      {p.interests.includes(i) && <Icon name="check" size={14} />}{i}
                    </button>
                  ))}
                </div>
                <p className="su-count">{p.interests.length} selected</p>
              </div>
            )}

            {step === 4 && (
              <div className="su-step">
                <h1 className="su-h1">You're all set, {p.name.split(" ")[0] || "creator"} ✦</h1>
                <p className="su-sub">Here's your profile. You can edit any of it from your page.</p>
                <ul className="su-recap">
                  <li><span>Handle</span><strong>@{handleClean}</strong></li>
                  <li><span>Bio</span><strong>{p.bio || <em>None yet</em>}</strong></li>
                  <li><span>Interests</span><strong>{p.interests.join(", ")}</strong></li>
                </ul>
              </div>
            )}
          </div>

          <div className="su-nav">
            {stepErr && <span className="su-err su-err-nav"><Icon name="close" size={14} />{stepErr}</span>}
            {step > 0 ? <button className="nu-btn-ghost" onClick={back}>Back</button> : <span />}
            <button className="nu-btn-post su-continue" disabled={!canNext || checking} onClick={next}>
              {checking ? <><span className="wr-spin" />Checking…</> : step === STEPS.length - 1 ? <>Enter nucorns<Icon name="sparkle" size={16} /></> : "Continue"}
            </button>
          </div>
        </div>

        {/* live preview column */}
        <div className="su-preview">
          <span className="su-preview-tag">Live preview</span>
          <div className="su-card">
            <div className="su-card-banner" style={{ background: `linear-gradient(120deg, ${p.bannerGrad[0]}, ${p.bannerGrad[1]} 55%, ${p.bannerGrad[2]})` }}>
              <span className="nu-ph-stripes" />
            </div>
            <div className="su-card-av">
              <Portrait grad={p.avatarGrad} src={p.avatarSrc} name={p.name || "You"} size={84} ring />
            </div>
            <div className="su-card-body">
              <div className="su-card-name">{p.name || "Your name"}</div>
              <div className="su-card-handle">@{handleClean || "yourhandle"}</div>
              <div className="su-card-bio">{p.bio || "Your short bio will appear here — a line about what you make."}</div>
              <div className="su-card-chips">
                {(p.interests.length ? p.interests : ["Add interests"]).slice(0, 6).map((i) => (
                  <span key={i} className="su-card-chip">{i}</span>
                ))}
              </div>
              <div className="su-card-stats">
                <span><strong>0</strong> posts</span>
                <span><strong>0</strong> followers</span>
                <span><strong>0</strong> following</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
