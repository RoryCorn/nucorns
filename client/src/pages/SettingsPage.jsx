import { useEffect, useRef, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import Nav from "../components/Nav";
import Icon from "../components/Icon";
import { Avatar } from "../components/Primitives";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { useAppearance, APPEARANCE_DEFAULTS } from "../lib/AppearanceContext";

const AV_PRESETS = [
  ["#FFB24D", "#FF6A1A"], ["#6FD0FF", "#1B8BE0"], ["#9BE7C4", "#2BB673"],
  ["#C9B6FF", "#7A5AF0"], ["#FF9EC4", "#F0568F"], ["#FFD27A", "#FF8A3D"],
];
const BN_PRESETS = [
  ["#FFCB7A", "#FF7A1A", "#1FA8F0"], ["#6FD0FF", "#1B8BE0", "#7A5AF0"],
  ["#9BE7C4", "#2BB673", "#1FA8F0"], ["#C9B6FF", "#7A5AF0", "#F0568F"],
  ["#FFD27A", "#FF8A3D", "#F0568F"],
];

function Field({ label, hint, children }) {
  return (
    <label className="su-field">
      <span className="su-label">{label}</span>
      {children}
      {hint && <span className="su-hint">{hint}</span>}
    </label>
  );
}

function SegRadio({ label, value, options, onChange, render }) {
  return (
    <div className="set-row">
      <span className="set-row-label">{label}</span>
      <div className="set-seg" role="radiogroup">
        {options.map((o) => (
          <button key={o} type="button" role="radio" aria-checked={value === o}
            className={"set-seg-btn" + (value === o ? " is-on" : "")} onClick={() => onChange(o)}>
            {render ? render(o) : o}
          </button>
        ))}
      </div>
    </div>
  );
}

function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const mismatch = next && confirm && next !== confirm;
  const canSave = current && next.length >= 6 && next === confirm && !busy;

  async function save(e) {
    e.preventDefault();
    if (!canSave) return;
    setErr(""); setBusy(true);
    try {
      await api.post("/users/me/password", { current, next });
      setDone(true);
      setCurrent(""); setNext(""); setConfirm("");
    } catch (ex) {
      setErr(ex.message || "Couldn't update password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="set-form" onSubmit={save}>
      {done && <p className="set-pw-ok"><Icon name="check" size={15} />Password updated successfully.</p>}
      <div className="set-row">
        <label className="set-row-label">Current password</label>
        <input className="su-input" type="password" value={current} placeholder="••••••••"
          onChange={(e) => { setCurrent(e.target.value); setDone(false); }} autoComplete="current-password" />
      </div>
      <div className="set-row">
        <label className="set-row-label">New password <span style={{ fontWeight: 500, color: "var(--muted)" }}>(min 6 characters)</span></label>
        <input className="su-input" type="password" value={next} placeholder="••••••••"
          onChange={(e) => { setNext(e.target.value); setDone(false); }} autoComplete="new-password" />
      </div>
      <div className="set-row">
        <label className="set-row-label">Confirm new password</label>
        <input className={"su-input" + (mismatch ? " su-input-err" : "")} type="password" value={confirm} placeholder="••••••••"
          onChange={(e) => { setConfirm(e.target.value); setDone(false); }} autoComplete="new-password" />
        {mismatch && <span className="su-err" style={{ marginTop: 4 }}><Icon name="close" size={13} />Passwords don't match</span>}
      </div>
      {err && <span className="su-err"><Icon name="close" size={14} />{err}</span>}
      <div className="set-actions">
        <button className="nu-btn-post" type="submit" disabled={!canSave}>
          {busy ? <><span className="wr-spin" />Saving…</> : "Update password"}
        </button>
      </div>
    </form>
  );
}

export default function SettingsPage() {
  const { user, loading: authLoading, setUser, logout } = useAuth();
  const { appearance, setAppearance } = useAppearance();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [interests, setInterests] = useState([]);
  const [avatarGrad, setAvatarGrad] = useState(AV_PRESETS[0]);
  const [bannerGrad, setBannerGrad] = useState(BN_PRESETS[0]);
  const [interestsList, setInterestsList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const [avatarErr, setAvatarErr] = useState("");
  const [avatarBusy, setAvatarBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name || "");
    setBio(user.bio || "");
    setLocation(user.location || "");
    setInterests(user.interests || []);
    setAvatarGrad(user.avatarGrad && user.avatarGrad.length >= 2 ? user.avatarGrad : AV_PRESETS[0]);
    setBannerGrad(user.bannerGrad && user.bannerGrad.length >= 2 ? user.bannerGrad : BN_PRESETS[0]);
  }, [user]);

  useEffect(() => {
    api.get("/users/interests").then((d) => setInterestsList(d.interests || [])).catch(() => {});
  }, []);

  if (authLoading) return null;
  if (!user) return <Navigate to="/welcome" replace />;

  function toggleInterest(i) {
    setInterests((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]));
  }

  async function onAvatarFile(f) {
    if (!f) return;
    setAvatarErr(""); setAvatarBusy(true);
    try {
      const d = await api.upload("/users/me/avatar", f, "avatar");
      setUser(d.user);
    } catch (e) {
      setAvatarErr(e.message);
    } finally {
      setAvatarBusy(false);
    }
  }

  async function saveProfile(e) {
    e.preventDefault();
    setErr(""); setSaved(false); setSaving(true);
    try {
      const d = await api.patch("/users/me", {
        name: name.trim(), bio: bio.trim(), location: location.trim(),
        interests, avatarGrad, bannerGrad,
      });
      setUser(d.user);
      setSaved(true);
    } catch (e) {
      setErr(e.message || "Couldn't save your profile.");
    } finally {
      setSaving(false);
    }
  }

  async function doLogout() {
    await logout();
    navigate("/");
  }

  return (
    <div className="nu-root">
      <Nav />
      <main className="nu-main set-main">
        <h1 className="set-title">Settings</h1>

        <section className="set-card">
          <div className="set-card-head">
            <h2>Profile</h2>
            <p>This is what readers see on your page.</p>
          </div>
          <form className="set-form" onSubmit={saveProfile}>
            <div className="set-avatar-row">
              <Avatar user={{ ...user, avatarGrad, name }} size={72} ring />
              <div>
                <button type="button" className="su-upload" onClick={() => fileRef.current.click()} disabled={avatarBusy}>
                  {avatarBusy ? <><span className="wr-spin" />Uploading…</> : <><Icon name="photo" size={16} />Upload photo</>}
                </button>
                <input ref={fileRef} type="file" accept="image/*" hidden
                  onChange={(e) => { onAvatarFile(e.target.files[0]); e.target.value = ""; }} />
                {avatarErr && <span className="su-err"><Icon name="close" size={14} />{avatarErr}</span>}
              </div>
            </div>

            <Field label="Display name">
              <input className="su-input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Short bio" hint={(160 - bio.length) + " characters left"}>
              <textarea className="su-input su-textarea" rows={3} maxLength={160} value={bio} onChange={(e) => setBio(e.target.value)} />
            </Field>
            <Field label="Location">
              <input className="su-input" value={location} maxLength={60} placeholder="City, country" onChange={(e) => setLocation(e.target.value)} />
            </Field>

            <Field label="Avatar color">
              <div className="su-swatches">
                {AV_PRESETS.map((g, i) => (
                  <button key={i} type="button" className={"su-swatch" + (avatarGrad === g ? " is-on" : "")}
                    style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})` }} onClick={() => setAvatarGrad(g)} />
                ))}
              </div>
            </Field>
            <Field label="Banner">
              <div className="su-swatches">
                {BN_PRESETS.map((g, i) => (
                  <button key={i} type="button" className={"su-swatch su-swatch-wide" + (bannerGrad === g ? " is-on" : "")}
                    style={{ background: `linear-gradient(120deg, ${g[0]}, ${g[1]} 55%, ${g[2]})` }} onClick={() => setBannerGrad(g)} />
                ))}
              </div>
            </Field>

            <Field label="Interests" hint={interests.length + " selected"}>
              <div className="su-chips">
                {interestsList.map((i) => (
                  <button key={i} type="button" className={"su-chip" + (interests.includes(i) ? " is-on" : "")} onClick={() => toggleInterest(i)}>
                    {interests.includes(i) && <Icon name="check" size={14} />}{i}
                  </button>
                ))}
              </div>
            </Field>

            <div className="set-actions">
              <button className="nu-btn-post" type="submit" disabled={saving}>
                {saving ? <><span className="wr-spin" />Saving…</> : "Save profile"}
              </button>
              {saved && <span className="set-saved"><Icon name="check" size={14} />Saved</span>}
              {err && <span className="su-err"><Icon name="close" size={14} />{err}</span>}
            </div>
          </form>
        </section>

        <section className="set-card">
          <div className="set-card-head">
            <h2>Appearance</h2>
            <p>Customize how nucorns looks for you — only you will see these changes.</p>
          </div>
          <div className="set-form">
            <SegRadio label="Style" value={appearance.direction} options={["playful", "minimal", "bold"]}
              onChange={(v) => setAppearance({ direction: v })} />

            <SegRadio label="Lead accent" value={appearance.lead} options={["sky", "orange"]}
              onChange={(v) => setAppearance({ lead: v })}
              render={(o) => (
                <span className="set-accent-opt">
                  <span className="set-accent-dot" style={{ background: o === "orange" ? "var(--orange)" : "var(--sky)" }} />
                  {o === "orange" ? "Orange" : "Sky"}
                </span>
              )} />

            <div className="set-row">
              <span className="set-row-label">Roundness <em>{appearance.roundness}px</em></span>
              <input type="range" className="set-slider" min={4} max={26} step={1} value={appearance.roundness}
                onChange={(e) => setAppearance({ roundness: Number(e.target.value) })} />
            </div>

            <div className="set-row">
              <span className="set-row-label">Font</span>
              <select className="su-input" style={{ maxWidth: 220 }} value={appearance.font}
                onChange={(e) => setAppearance({ font: e.target.value })}>
                {["Jakarta", "Sora", "Hanken"].map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <SegRadio label="Density" value={appearance.density} options={["cozy", "comfy"]}
              onChange={(v) => setAppearance({ density: v })} />

            <div className="set-row set-row-h">
              <span className="set-row-label">Show hero image on stories</span>
              <button type="button" className={"set-toggle" + (appearance.showHero ? " is-on" : "")}
                role="switch" aria-checked={appearance.showHero}
                onClick={() => setAppearance({ showHero: !appearance.showHero })}><i /></button>
            </div>

            <div className="set-actions">
              <button type="button" className="nu-btn-ghost" onClick={() => setAppearance(APPEARANCE_DEFAULTS)}>Reset to defaults</button>
            </div>
          </div>
        </section>

        <section className="set-card">
          <div className="set-card-head">
            <h2>Change password</h2>
            <p>Choose a new password for your account.</p>
          </div>
          <PasswordForm />
        </section>

        <section className="set-card">
          <div className="set-card-head">
            <h2>Account</h2>
            <p>Signed in as @{user.handle}</p>
          </div>
          <div className="set-actions">
            <button className="nu-btn-ghost" onClick={doLogout}><Icon name="lock" size={15} />Sign out</button>
          </div>
        </section>

        <footer className="nu-foot">made with <span className="nu-foot-mark">nucorns</span> · your settings, your call ✦</footer>
      </main>
    </div>
  );
}
