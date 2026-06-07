const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { serializeUser, getUserByHandle } = require("../auth");
const { moderateText } = require("../lib/moderation");

const router = express.Router();

const TAKEN = ["nucorns", "test", "support"];
const HANDLE_RE = /^[a-z0-9_]{3,20}$/;

router.get("/me", (req, res) => {
  res.json({ user: req.currentUser });
});

router.post("/handle-available", (req, res) => {
  const handle = String(req.body.handle || "").toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (!handle) return res.json({ ok: false, msg: "" });
  if (handle.length < 3) return res.json({ ok: false, msg: "At least 3 characters" });
  if (TAKEN.includes(handle) || getUserByHandle(handle)) return res.json({ ok: false, msg: "That handle is taken", taken: true });
  return res.json({ ok: true, msg: "Available" });
});

router.post("/signup", async (req, res) => {
  const { name, handle, email, password, bio, interests, avatarGrad, bannerGrad, avatarSrc } = req.body || {};

  const cleanHandle = String(handle || "").toLowerCase().replace(/[^a-z0-9_]/g, "");
  const cleanName = String(name || "").trim();
  const cleanBio = String(bio || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();

  if (cleanName.length < 2) return res.status(400).json({ error: "Display name is too short." });
  if (!HANDLE_RE.test(cleanHandle)) return res.status(400).json({ error: "Handle must be 3-20 letters, numbers or underscores." });
  if (TAKEN.includes(cleanHandle) || getUserByHandle(cleanHandle)) return res.status(400).json({ error: "That handle is taken." });
  if (!cleanEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) return res.status(400).json({ error: "Enter a valid email." });
  if (db.prepare("SELECT id FROM users WHERE email = ?").get(cleanEmail)) return res.status(400).json({ error: "An account with that email already exists." });
  if (!password || String(password).length < 6) return res.status(400).json({ error: "Password must be at least 6 characters." });
  if (!Array.isArray(interests) || interests.length < 3) return res.status(400).json({ error: "Pick at least 3 interests." });

  const nameCheck = await moderateText(cleanName);
  if (nameCheck.status === "blocked") return res.status(422).json({ error: nameCheck.reason, field: "name" });
  if (cleanBio) {
    const bioCheck = await moderateText(cleanBio);
    if (bioCheck.status === "blocked") return res.status(422).json({ error: bioCheck.reason, field: "bio" });
  }

  const passwordHash = bcrypt.hashSync(String(password), 10);
  const ts = Date.now();
  const info = db.prepare(`
    INSERT INTO users (handle, name, email, password_hash, bio, location, interests, avatar_grad, avatar_src, banner_grad, is_admin, is_demo, followers, following, themes, created_at)
    VALUES (@handle, @name, @email, @password_hash, @bio, '', @interests, @avatar_grad, @avatar_src, @banner_grad, 0, 0, 0, 0, '[]', @created_at)
  `).run({
    handle: cleanHandle, name: cleanName, email: cleanEmail, password_hash: passwordHash,
    bio: cleanBio, interests: JSON.stringify(interests),
    avatar_grad: JSON.stringify(Array.isArray(avatarGrad) && avatarGrad.length ? avatarGrad : ["#FFD27A", "#FF8A3D"]),
    avatar_src: avatarSrc || null,
    banner_grad: JSON.stringify(Array.isArray(bannerGrad) && bannerGrad.length ? bannerGrad : ["#FFCB7A", "#FF7A1A", "#1FA8F0"]),
    created_at: ts,
  });

  req.session.userId = info.lastInsertRowid;
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json({ user: serializeUser(row) });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(String(email || "").trim().toLowerCase());
  if (!row || !row.password_hash || !bcrypt.compareSync(String(password || ""), row.password_hash)) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }
  req.session.userId = row.id;
  res.json({ user: serializeUser(row) });
});

router.post("/logout", (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

module.exports = router;
