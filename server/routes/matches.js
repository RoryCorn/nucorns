const express = require("express");
const db = require("../db");
const { serializeUser, requireAuth } = require("../auth");
const { nuTopMatches } = require("../lib/matching");

const router = express.Router();

// GET /api/matches — "creators you might vibe with" for the signed-in user
router.get("/", requireAuth, (req, res) => {
  const me = req.user;
  const stories = db.prepare("SELECT title, dek FROM posts WHERE author_id = ?").all(me.id);
  const candidates = db.prepare("SELECT * FROM users WHERE id != ?").all(me.id).map((u) => ({
    id: u.id, handle: u.handle, name: u.name,
    interests: JSON.parse(u.interests || "[]"),
    themes: JSON.parse(u.themes || "[]"),
    avatarGrad: JSON.parse(u.avatar_grad || "[]"),
  }));

  const profile = { handle: me.handle, interests: JSON.parse(me.interests || "[]"), bio: me.bio };
  const top = nuTopMatches(profile, stories, candidates, 3);

  const wavedRows = db.prepare("SELECT to_user_id FROM waves WHERE from_user_id = ?").all(me.id);
  const wavedSet = new Set(wavedRows.map((r) => r.to_user_id));

  res.json({
    matches: top.map((m) => ({
      user: { id: m.c.id, handle: m.c.handle, name: m.c.name, avatarGrad: m.c.avatarGrad },
      shared: m.shared,
      themeHits: m.themeHits,
      waved: wavedSet.has(m.c.id),
    })),
  });
});

// POST /api/matches/wave  { handle }
router.post("/wave", requireAuth, (req, res) => {
  const target = db.prepare("SELECT * FROM users WHERE handle = ?").get(String(req.body.handle || "").toLowerCase());
  if (!target) return res.status(404).json({ error: "Creator not found." });
  if (target.id === req.user.id) return res.status(400).json({ error: "You can't wave at yourself." });
  try {
    db.prepare("INSERT OR IGNORE INTO waves (from_user_id, to_user_id, created_at) VALUES (?, ?, ?)").run(req.user.id, target.id, Date.now());
  } catch (e) {}
  res.json({ ok: true, waved: true, name: target.name });
});

module.exports = router;
