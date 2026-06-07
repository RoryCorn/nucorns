import { useState } from "react";
import Icon from "./Icon";
import { nuFmt } from "../lib/format";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

export default function Reaction({ targetType, targetId, counts, mine, big = false }) {
  const { user } = useAuth();
  const [val, setVal] = useState(mine ? mine.value : null);
  const [c, setC] = useState(counts || { up: 0, mixed: 0, down: 0 });
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState((mine && mine.note) || "");
  const [saved, setSaved] = useState((mine && mine.note) || "");
  const [pop, setPop] = useState(null);
  const [busy, setBusy] = useState(false);

  async function send(nextVal, nextNote) {
    if (!user || busy) return;
    setBusy(true);
    try {
      const res = await api.put("/reactions", { targetType, targetId, value: nextVal, note: nextNote });
      setC(res.counts);
      setVal(res.mine ? res.mine.value : null);
      setSaved(res.mine ? res.mine.note : "");
    } catch (e) {} finally { setBusy(false); }
  }

  function pick(k) {
    if (!user) return;
    const prev = val;
    const next = prev === k ? null : k;
    setVal(next);
    setC((cur) => {
      const n = { ...cur };
      if (prev) n[prev] = Math.max(0, n[prev] - 1);
      if (next) n[next] = (n[next] || 0) + 1;
      return n;
    });
    if (next) { setPop(k); setTimeout(() => setPop(null), 460); }
    setOpen(next === "mixed");
    send(next, next === "mixed" ? (saved || null) : null);
  }

  function shareNote() {
    if (!note.trim()) return;
    setSaved(note.trim());
    setOpen(false);
    send(val || "mixed", note.trim());
  }

  const sz = big ? 20 : 17;

  return (
    <div className={"rx" + (big ? " rx-big" : "")}>
      <div className="rx-group">
        <button className={"rx-btn rx-up" + (val === "up" ? " is-on" : "") + (pop === "up" ? " pop" : "")} onClick={() => pick("up")} title="Like" aria-pressed={val === "up"}>
          <Icon name="thumb" size={sz} fill={val === "up" ? "currentColor" : "none"} />
          <span className="rx-n">{nuFmt(Math.max(0, c.up))}</span>
        </button>
        <button className={"rx-btn rx-mixed" + (val === "mixed" ? " is-on" : "") + (pop === "mixed" ? " pop" : "")} onClick={() => pick("mixed")} title="On the fence" aria-pressed={val === "mixed"}>
          <span className="rx-sideways"><Icon name="thumb" size={sz} fill={val === "mixed" ? "currentColor" : "none"} /></span>
          <span className="rx-n">{nuFmt(Math.max(0, c.mixed))}</span>
        </button>
        <button className={"rx-btn rx-down" + (val === "down" ? " is-on" : "") + (pop === "down" ? " pop" : "")} onClick={() => pick("down")} title="Dislike" aria-pressed={val === "down"}>
          <span className="rx-flip"><Icon name="thumb" size={sz} fill={val === "down" ? "currentColor" : "none"} /></span>
          <span className="rx-n">{nuFmt(Math.max(0, c.down))}</span>
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
          <Icon name="sparkle" size={13} /><span>Your take: "{saved}"</span>
        </button>
      )}
    </div>
  );
}
