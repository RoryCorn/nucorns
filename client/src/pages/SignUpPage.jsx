import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import Icon from "../components/Icon";
import { Avatar } from "../components/Primitives";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

const AV_PRESETS = [
  ["#FFB24D", "#FF6A1A"], ["#6FD0FF", "#1B8BE0"], ["#9BE7C4", "#2BB673"],
  ["#C9B6FF", "#7A5AF0"], ["#FF9EC4", "#F0568F"], ["#FFD27A", "#FF8A3D"],
];
const BN_PRESETS = [
  ["#FFCB7A", "#FF7A1A", "#1FA8F0"], ["#6FD0FF", "#1B8BE0", "#7A5AF0"],
  ["#9BE7C4", "#2BB673", "#1FA8F0"], ["#C9B6FF", "#7A5AF0", "#F0568F"],
  ["#FFD27A", "#FF8A3D", "#F0568F"],
];
const STEPS = ["Identity", "Look", "About you", "Interests", "Ready"];
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function Field({ label, hint, children }) {
  return (
    <label className="su-field">
      <span className="su-label">{label}</span>
      {children}
      {hint && <span className="su-hint">{hint}</span>}
    </label>
  );
}

function Brand() {
  return (
    <Link className="nu-wordmark" to="/">
      <img className="nu-logo-img" src="/nucorns-mark-circle.png" alt="" />nu<span>corns</span>
    </Link>
  );
}

function SignupFlow({ onDone, onSwitchToLogin }) {
  const { signup } = useAuth();
  const [step, setStep] = useState(0);
  const [p, setP] = useState({
    name: "", handle: "", email: "", password: "", bio: "", interests: [],
    avatarGrad: AV_PRESETS[1], bannerGrad: BN_PRESETS[0],
  });
  const set = (k, v) => setP((o) => ({ ...o, [k]: v }));
  const [stepErr, setStepErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [interestsList, setInterestsList] = useState([]);
  const [handleState, setHandleState] = useState({ ok: false, msg: "" });
  const [handleChecking, setHandleChecking] = useState(false);

  useEffect(() => {
    api.get("/users/interests").then((d) => setInterestsList(d.interests || [])).catch(() => {});
  }, []);

  const handleClean = p.handle.toLowerCase().replace(/[^a-z0-9_]/g, "");
  useEffect(() => {
    if (!handleClean) { setHandleState({ ok: false, msg: "" }); setHandleChecking(false); return; }
    if (handleClean.length < 3) { setHandleState({ ok: false, msg: "At least 3 characters" }); setHandleChecking(false); return; }
    let live = true;
    setHandleChecking(true);
    const t = setTimeout(() => {
      api.post("/auth/handle-available", { handle: handleClean })
        .then((d) => { if (live) setHandleState(d); })
        .finally(() => { if (live) setHandleChecking(false); });
    }, 350);
    return () => { live = false; clearTimeout(t); };
  }, [handleClean]);

  const emailOk = EMAIL_RE.test(p.email.trim());
  const canNext = [
    p.name.trim().length >= 2 && handleState.ok && emailOk && p.password.length >= 6,
    true,
    true,
    p.interests.length >= 3,
    true,
  ][step];

  function toggleInterest(i) {
    set("interests", p.interests.includes(i) ? p.interests.filter((x) => x !== i) : [...p.interests, i]);
  }

  async function finish() {
    setStepErr(""); setBusy(true);
    try {
      const u = await signup({
        name: p.name.trim(), handle: handleClean, email: p.email.trim(), password: p.password,
        bio: p.bio.trim(), interests: p.interests, avatarGrad: p.avatarGrad, bannerGrad: p.bannerGrad,
      });
      onDone(u);
    } catch (e) {
      const field = e.data && e.data.field;
      if (field === "name") setStep(0);
      else if (field === "bio") setStep(2);
      setStepErr(e.message || "Couldn't create your account.");
    } finally {
      setBusy(false);
    }
  }

  function next() {
    setStepErr("");
    if (step < STEPS.length - 1) setStep(step + 1);
    else finish();
  }
  function back() { if (step > 0) { setStepErr(""); setStep(step - 1); } }

  return (
    <>
      <div className="su-form">
        <div className="su-top">
          <Brand />
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
              <Field label="Handle" hint={handleClean ? (handleChecking ? "Checking…" : handleState.msg) : "Letters, numbers & underscores"}>
                <div className={"su-handle" + (handleClean ? (handleState.ok ? " is-ok" : " is-bad") : "")}>
                  <span>@</span>
                  <input value={p.handle} maxLength={20} placeholder="yourhandle"
                    onChange={(e) => set("handle", e.target.value)} />
                  {handleClean && !handleChecking && (handleState.ok
                    ? <Icon name="check" size={18} />
                    : handleState.taken ? <Icon name="close" size={18} /> : null)}
                </div>
              </Field>
              <Field label="Email">
                <input className="su-input" type="email" value={p.email} placeholder="you@example.com"
                  onChange={(e) => set("email", e.target.value)} />
              </Field>
              <Field label="Password" hint="At least 6 characters">
                <input className="su-input" type="password" value={p.password} placeholder="••••••••"
                  onChange={(e) => set("password", e.target.value)} />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="su-step">
              <h1 className="su-h1">Make it yours</h1>
              <p className="su-sub">Pick a vibe now — you can upload real photos anytime later from your profile.</p>
              <Field label="Avatar">
                <div className="su-swatches">
                  {AV_PRESETS.map((g, i) => (
                    <button key={i} className={"su-swatch" + (p.avatarGrad === g ? " is-on" : "")}
                      style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})` }}
                      onClick={() => set("avatarGrad", g)} aria-label={`Avatar color ${i + 1}`} />
                  ))}
                </div>
              </Field>
              <Field label="Banner">
                <div className="su-swatches">
                  {BN_PRESETS.map((g, i) => (
                    <button key={i} className={"su-swatch su-swatch-wide" + (p.bannerGrad === g ? " is-on" : "")}
                      style={{ background: `linear-gradient(120deg, ${g[0]}, ${g[1]} 55%, ${g[2]})` }}
                      onClick={() => set("bannerGrad", g)} aria-label={`Banner color ${i + 1}`} />
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
                {interestsList.map((i) => (
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
                <li><span>Email</span><strong>{p.email.trim()}</strong></li>
                <li><span>Bio</span><strong>{p.bio || <em>None yet</em>}</strong></li>
                <li><span>Interests</span><strong>{p.interests.join(", ")}</strong></li>
              </ul>
            </div>
          )}
        </div>

        <div className="su-nav">
          {stepErr && <span className="su-err su-err-nav" role="alert"><Icon name="close" size={14} />{stepErr}</span>}
          {step > 0 ? <button className="nu-btn-ghost" onClick={back}>Back</button> : <span />}
          <button className="nu-btn-post su-continue" disabled={!canNext || busy} onClick={next}>
            {busy ? <><span className="wr-spin" />Creating…</> : step === STEPS.length - 1 ? <>Enter nucorns<Icon name="sparkle" size={16} /></> : "Continue"}
          </button>
        </div>
        <p className="su-switch">Already have an account? <button className="su-switch-btn" onClick={onSwitchToLogin}>Sign in</button></p>
      </div>

      <div className="su-preview">
        <span className="su-preview-tag">Live preview</span>
        <div className="su-card">
          <div className="su-card-banner" style={{ background: `linear-gradient(120deg, ${p.bannerGrad[0]}, ${p.bannerGrad[1]} 55%, ${p.bannerGrad[2]})` }}>
            <span className="nu-ph-stripes" />
          </div>
          <div className="su-card-av">
            <Avatar user={{ avatarGrad: p.avatarGrad, name: p.name || "You" }} size={84} ring />
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
    </>
  );
}

function LoginForm({ onDone, onSwitchToSignup }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setErr(""); setBusy(true);
    try {
      const u = await login(email.trim(), password);
      onDone(u);
    } catch (e) {
      setErr(e.message || "Couldn't sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="su-form">
      <div className="su-top"><Brand /></div>
      <form className="su-step" onSubmit={submit}>
        <h1 className="su-h1">Welcome back</h1>
        <p className="su-sub">Sign in to keep writing, reacting & vibing with creators.</p>
        <Field label="Email or handle">
          <input className="su-input" value={email} placeholder="you@example.com or yourhandle"
            onChange={(e) => setEmail(e.target.value)} autoFocus autoComplete="username" />
        </Field>
        <Field label="Password">
          <input className="su-input" type="password" value={password} placeholder="••••••••"
            onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {err && <span className="su-err"><Icon name="close" size={14} />{err}</span>}
        <button className="nu-btn-post su-continue" type="submit" disabled={busy || !email.trim() || !password}>
          {busy ? <><span className="wr-spin" />Signing in…</> : <>Sign in<Icon name="sparkle" size={16} /></>}
        </button>
      </form>
      <p className="su-switch">New to nucorns? <button className="su-switch-btn" onClick={onSwitchToSignup}>Create an account</button></p>
    </div>
  );
}

export default function SignUpPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("signup");

  useEffect(() => {
    if (user) navigate(`/u/${user.handle}`, { replace: true });
  }, [user, navigate]);

  if (user) return null;

  function done(u) { navigate(`/u/${u.handle}`, { replace: true }); }

  return (
    <div className="su-root">
      <div className="su-shell" style={mode === "login" ? { gridTemplateColumns: "1fr", maxWidth: 460 } : undefined}>
        {mode === "signup"
          ? <SignupFlow onDone={done} onSwitchToLogin={() => setMode("login")} />
          : <LoginForm onDone={done} onSwitchToSignup={() => setMode("signup")} />}
      </div>
    </div>
  );
}
