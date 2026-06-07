const express = require("express");
const db = require("../db");
const { serializeUser, getUserById, getUserByHandle, requireAuth } = require("../auth");
const { moderateText } = require("../lib/moderation");
const { upload, fileUrl } = require("../lib/uploads");
const { moderateImageBuffer } = require("../lib/image-moderation");
const fs = require("fs");

const router = express.Router();

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function reactionCounts(targetType, targetId) {
  const rows = db.prepare("SELECT value, COUNT(*) AS n FROM reactions WHERE target_type = ? AND target_id = ?").all(targetType, targetId);
  const counts = { up: 0, mixed: 0, down: 0 };
  rows.forEach((r) => { if (counts[r.value] != null) counts[r.value] = r.n; });
  return counts;
}

function myReaction(targetType, targetId, userId) {
  if (!userId) return null;
  const row = db.prepare("SELECT value, note FROM reactions WHERE target_type = ? AND target_id = ? AND user_id = ?").get(targetType, targetId, userId);
  return row ? { value: row.value, note: row.note || "" } : null;
}

function serializePost(row, opts = {}) {
  const author = getUserById(row.author_id);
  const commentCount = db.prepare("SELECT COUNT(*) AS n FROM comments WHERE post_id = ?").get(row.id).n;
  return {
    id: row.id,
    author: author ? { id: author.id, handle: author.handle, name: author.name, avatarGrad: JSON.parse(author.avatar_grad || "[]"), avatarSrc: author.avatar_src, isAdmin: !!author.is_admin } : null,
    mine: opts.viewerId ? row.author_id === opts.viewerId : false,
    category: row.category,
    title: row.title,
    dek: row.dek,
    body: JSON.parse(row.body || "[]"),
    cover: JSON.parse(row.cover || "[]"),
    media: JSON.parse(row.media || "[]"),
    date: fmtDate(row.created_at),
    readTime: row.read_time,
    hearts: row.hearts,
    shares: row.shares,
    comments: commentCount,
    reactions: reactionCounts("post", row.id),
    myReaction: myReaction("post", row.id, opts.viewerId),
    pinned: !!row.pinned,
    unverified: !!row.unverified,
    createdAt: row.created_at,
  };
}

// GET /api/posts?author=handle  — feed for a creator's profile
router.get("/", (req, res) => {
  const handle = req.query.author;
  let rows;
  if (handle) {
    const author = getUserByHandle(String(handle).toLowerCase());
    if (!author) return res.status(404).json({ error: "Creator not found." });
    rows = db.prepare("SELECT * FROM posts WHERE author_id = ? ORDER BY created_at DESC").all(author.id);
  } else {
    rows = db.prepare("SELECT * FROM posts ORDER BY created_at DESC").all();
  }
  const viewerId = req.user ? req.user.id : null;
  res.json({ posts: rows.map((r) => serializePost(r, { viewerId })) });
});

router.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM posts WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Story not found." });
  const viewerId = req.user ? req.user.id : null;
  res.json({ post: serializePost(row, { viewerId }) });
});

const WR_CATS = ["Field Notes", "Gear", "Essay", "Tutorial", "Personal"];

// POST /api/posts — publish a story (with safety check)
router.post("/", requireAuth, async (req, res) => {
  const { category, title, dek, body, cover, media } = req.body || {};
  const cleanTitle = String(title || "").trim();
  const cleanDek = String(dek || "").trim();
  const cleanBody = String(body || "").trim();
  if (cleanTitle.length < 4 || cleanBody.length < 12) {
    return res.status(400).json({ error: "Add a title (4+ chars) and a body (12+ chars)." });
  }
  const combined = [cleanTitle, cleanDek, cleanBody].filter(Boolean).join("\n\n");
  const check = await moderateText(combined);
  if (check.status === "blocked") {
    return res.status(422).json({ error: "blocked", title: "This needs an edit before it goes live", message: check.reason, categories: check.categories });
  }

  const words = cleanBody.split(/\s+/).filter(Boolean).length;
  const id = "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const ts = Date.now();
  const coverVal = cover && (cover.src || (Array.isArray(cover) && cover.length)) ? cover : ["#FFCB7A", "#FF7A1A", "#1FA8F0"];

  db.prepare(`
    INSERT INTO posts (id, author_id, category, title, dek, body, cover, read_time, hearts, shares, pinned, unverified, media, created_at)
    VALUES (@id, @author_id, @category, @title, @dek, @body, @cover, @read_time, 0, 0, 0, @unverified, @media, @created_at)
  `).run({
    id, author_id: req.user.id,
    category: WR_CATS.includes(category) ? category : WR_CATS[0],
    title: cleanTitle,
    dek: cleanDek || cleanBody.slice(0, 110),
    body: JSON.stringify(cleanBody.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean)),
    cover: JSON.stringify(coverVal),
    read_time: Math.max(1, Math.round(words / 200)) + " min",
    unverified: check.unverified ? 1 : 0,
    media: JSON.stringify(Array.isArray(media) ? media : []),
    created_at: ts,
  });

  const row = db.prepare("SELECT * FROM posts WHERE id = ?").get(id);
  res.status(201).json({ post: serializePost(row, { viewerId: req.user.id }) });
});

// POST /api/posts/media — upload a cover/gallery photo or video for a story (moderated if image)
router.post("/media/upload", requireAuth, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });
  const isImage = /^image\//.test(req.file.mimetype);
  if (isImage) {
    const buffer = fs.readFileSync(req.file.path);
    const result = await moderateImageBuffer(buffer, req.file.originalname);
    if (result.status === "blocked") {
      fs.unlink(req.file.path, () => {});
      return res.status(422).json({ error: result.reason });
    }
  }
  res.json({ url: fileUrl(req.file.filename), kind: isImage ? "photo" : "video" });
});

module.exports = router;
