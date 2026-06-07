const express = require("express");
const db = require("../db");
const { serializeUser, getUserByHandle, requireAuth } = require("../auth");
const { moderateText } = require("../lib/moderation");
const { upload, fileUrl } = require("../lib/uploads");
const { moderateImageBuffer } = require("../lib/image-moderation");
const fs = require("fs");

const router = express.Router();

const NU_INTERESTS = [
  "Photography", "Filmmaking", "Writing", "Travel", "Design", "Music",
  "Food", "Fitness", "Tech", "Illustration", "Nature", "Fashion",
  "Gaming", "Books", "Coffee", "Architecture", "Street", "Analog",
];

router.get("/interests", (req, res) => res.json({ interests: NU_INTERESTS }));

router.get("/:handle", (req, res) => {
  const row = getUserByHandle(req.params.handle.toLowerCase());
  if (!row) return res.status(404).json({ error: "Creator not found." });
  const storyCount = db.prepare("SELECT COUNT(*) AS n FROM posts WHERE author_id = ?").get(row.id).n;
  res.json({ user: serializeUser(row), storyCount });
});

router.patch("/me", requireAuth, async (req, res) => {
  const { name, bio, location, interests, avatarGrad, bannerGrad, appearance } = req.body || {};
  const updates = {};
  if (typeof name === "string" && name.trim().length >= 2) {
    const check = await moderateText(name.trim());
    if (check.status === "blocked") return res.status(422).json({ error: check.reason, field: "name" });
    updates.name = name.trim();
  }
  if (typeof bio === "string") {
    if (bio.trim()) {
      const check = await moderateText(bio.trim());
      if (check.status === "blocked") return res.status(422).json({ error: check.reason, field: "bio" });
    }
    updates.bio = bio.trim();
  }
  if (typeof location === "string") updates.location = location.trim().slice(0, 60);
  if (Array.isArray(interests)) updates.interests = JSON.stringify(interests.slice(0, 12));
  if (Array.isArray(avatarGrad) && avatarGrad.length >= 2) updates.avatar_grad = JSON.stringify(avatarGrad);
  if (Array.isArray(bannerGrad) && bannerGrad.length >= 2) updates.banner_grad = JSON.stringify(bannerGrad);
  if (appearance && typeof appearance === "object") updates.appearance = JSON.stringify(appearance);

  const keys = Object.keys(updates);
  if (keys.length) {
    const setClause = keys.map((k) => `${k} = @${k}`).join(", ");
    db.prepare(`UPDATE users SET ${setClause} WHERE id = @id`).run({ ...updates, id: req.user.id });
  }
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  res.json({ user: serializeUser(row) });
});

router.post("/me/avatar", requireAuth, upload.single("avatar"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image uploaded." });
  const buffer = fs.readFileSync(req.file.path);
  const result = await moderateImageBuffer(buffer, req.file.originalname, { maxDim: 320 });
  if (result.status === "blocked") {
    fs.unlink(req.file.path, () => {});
    return res.status(422).json({ error: result.reason });
  }
  const url = fileUrl(req.file.filename);
  db.prepare("UPDATE users SET avatar_src = ? WHERE id = ?").run(url, req.user.id);
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  res.json({ user: serializeUser(row) });
});

router.put("/me/appearance", requireAuth, (req, res) => {
  const appearance = req.body && req.body.appearance;
  if (!appearance || typeof appearance !== "object") return res.status(400).json({ error: "Missing appearance settings." });
  db.prepare("UPDATE users SET appearance = ? WHERE id = ?").run(JSON.stringify(appearance), req.user.id);
  res.json({ appearance });
});

module.exports = router;
