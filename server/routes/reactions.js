const express = require("express");
const db = require("../db");
const { requireAuth } = require("../auth");

const router = express.Router();

const TARGETS = ["post", "comment"];
const VALUES = ["up", "mixed", "down"];

function counts(targetType, targetId) {
  const rows = db.prepare("SELECT value, COUNT(*) AS n FROM reactions WHERE target_type = ? AND target_id = ?").all(targetType, targetId);
  const c = { up: 0, mixed: 0, down: 0 };
  rows.forEach((r) => { if (c[r.value] != null) c[r.value] = r.n; });
  return c;
}

// PUT /api/reactions  { targetType, targetId, value: 'up'|'mixed'|'down'|null, note? }
// Sending the same value again clears the reaction (toggle), matching the prototype.
router.put("/", requireAuth, (req, res) => {
  const { targetType, targetId, value, note } = req.body || {};
  if (!TARGETS.includes(targetType) || !targetId) return res.status(400).json({ error: "Invalid reaction target." });
  if (value !== null && !VALUES.includes(value)) return res.status(400).json({ error: "Invalid reaction value." });

  if (targetType === "post") {
    if (!db.prepare("SELECT id FROM posts WHERE id = ?").get(targetId)) return res.status(404).json({ error: "Story not found." });
  } else {
    if (!db.prepare("SELECT id FROM comments WHERE id = ?").get(targetId)) return res.status(404).json({ error: "Comment not found." });
  }

  const existing = db.prepare("SELECT * FROM reactions WHERE target_type = ? AND target_id = ? AND user_id = ?").get(targetType, targetId, req.user.id);

  if (value === null || (existing && existing.value === value && note == null)) {
    if (existing) db.prepare("DELETE FROM reactions WHERE id = ?").run(existing.id);
  } else if (existing) {
    db.prepare("UPDATE reactions SET value = ?, note = ? WHERE id = ?").run(value, note != null ? String(note).trim().slice(0, 500) : existing.note, existing.id);
  } else {
    db.prepare("INSERT INTO reactions (target_type, target_id, user_id, value, note, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(targetType, targetId, req.user.id, value, note != null ? String(note).trim().slice(0, 500) : "", Date.now());
  }

  const mine = db.prepare("SELECT value, note FROM reactions WHERE target_type = ? AND target_id = ? AND user_id = ?").get(targetType, targetId, req.user.id);
  res.json({ counts: counts(targetType, targetId), mine: mine ? { value: mine.value, note: mine.note || "" } : null });
});

module.exports = router;
