// nucorns — three-way reaction: like / on-the-fence / dislike.
// Choosing "on the fence" opens a small box to expound (placeholder: "Care to expound?").
const { useState } = React;

function Reaction({ seed, big = false }) {
  const s = seed || { up: 0, mixed: 0, down: 0 };
  const [val, setVal] = useState(null);          // null | 'up' | 'mixed' | 'down'
  const [counts, setCounts] = useState(s);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState("");
  const [pop, setPop] = useState(null);

  function pick(k) {
    const prev = val;
    const next = prev === k ? null : k;
    setVal(next);
    setCounts((c) => {
      const n = { ...c };
      if (prev) n[prev] -= 1;
      if (next) n[next] += 1;
      return n;
    });
    if (next) { setPop(k); setTimeout(() => setPop(null), 460); }
    setOpen(next === "mixed");
    if (next !== "mixed") { /* keep saved note if any */ }
  }

  function shareNote() {
    if (!note.trim()) return;
    setSaved(note.trim());
    setOpen(false);
  }

  const sz = big ? 20 : 17;

  return (
    <div className={"rx" + (big ? " rx-big" : "")}>
      <div className="rx-group">
        <button className={"rx-btn rx-up" + (val === "up" ? " is-on" : "") + (pop === "up" ? " pop" : "")} onClick={() => pick("up")} title="Like" aria-pressed={val === "up"}>
          <Icon name="thumb" size={sz} fill={val === "up" ? "currentColor" : "none"} />
          <span className="rx-n">{nuFmt(Math.max(0, counts.up))}</span>
        </button>
        <button className={"rx-btn rx-mixed" + (val === "mixed" ? " is-on" : "") + (pop === "mixed" ? " pop" : "")} onClick={() => pick("mixed")} title="On the fence" aria-pressed={val === "mixed"}>
          <span className="rx-sideways"><Icon name="thumb" size={sz} fill={val === "mixed" ? "currentColor" : "none"} /></span>
          <span className="rx-n">{nuFmt(Math.max(0, counts.mixed))}</span>
        </button>
        <button className={"rx-btn rx-down" + (val === "down" ? " is-on" : "") + (pop === "down" ? " pop" : "")} onClick={() => pick("down")} title="Dislike" aria-pressed={val === "down"}>
          <span className="rx-flip"><Icon name="thumb" size={sz} fill={val === "down" ? "currentColor" : "none"} /></span>
          <span className="rx-n">{nuFmt(Math.max(0, counts.down))}</span>
        </button>
      </div>

      {open && (
        <div className="rx-expound">
          <textarea
            className="rx-ta" autoFocus rows={2} value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) shareNote(); }}
            placeholder="Care to expound?"
          />
          <div className="rx-expound-bar">
            <span className="rx-expound-hint">Mixed feelings? Tell us what tipped you each way.</span>
            <button className="rx-share" disabled={!note.trim()} onClick={shareNote}>Share take</button>
          </div>
        </div>
      )}

      {saved && !open && (
        <button className="rx-saved" onClick={() => setOpen(true)} title="Edit your take">
          <Icon name="sparkle" size={13} /><span>Your take: “{saved}”</span>
        </button>
      )}
    </div>
  );
}

Object.assign(window, { Reaction });
