const express = require("express");
const db = require("../db");
const { getUserById, requireAuth } = require("../auth");
const { moderateText } = require("../lib/moderation");
const { upload, fileUrl } = require("../lib/uploads");
const { moderateImageBuffer } = require("../lib/image-moderation");
const fs = require("fs");

const router = express.Router({ mergeParams: true });

function timeAgo(ts) {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return "now";
  const m = Math.round(s / 60);
  if (m < 60) return m + "m";
  const h = Math.round(m / 60);
  if (h < 24) return h + "h";
  const d = Math.round(h / 24);
  if (d < 7) return d + "d";
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
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

function serializeComment(row, viewerId) {
  const author = getUserById(row.author_id);
  return {
    id: row.id,
    parentId: row.parent_id,
    author: author ? { id: author.id, handle: author.handle, name: author.name, avatarGrad: JSON.parse(author.avatar_grad || "[]"), avatarSrc: author.avatar_src, isAdmin: !!author.is_admin } : null,
    time: timeAgo(row.created_at),
    body: row.body,
    media: JSON.parse(row.media || "[]"),
    reactions: reactionCounts("comment", row.id),
    myReaction: myReaction("comment", row.id, viewerId),
    createdAt: row.created_at,
    replies: [],
  };
}

function buildTree(rows, viewerId) {
  const byId = {};
  const roots = [];
  rows.forEach((r) => { byId[r.id] = serializeComment(r, viewerId); });
  rows.forEach((r) => {
    const node = byId[r.id];
    if (r.parent_id && byId[r.parent_id]) byId[r.parent_id].replies.push(node);
    else roots.push(node);
  });
  return roots;
}

// GET /api/posts/:postId/comments
router.get("/", (req, res) => {
  const post = db.prepare("SELECT id FROM posts WHERE id = ?").get(req.params.postId);
  if (!post) return res.status(404).json({ error: "Story not found." });
  const rows = db.prepare("SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC").all(post.id);
  const viewerId = req.user ? req.user.id : null;
  res.json({ comments: buildTree(rows, viewerId), total: rows.length });
});

// POST /api/posts/:postId/comments  { body, media: [...], parentId? }
router.post("/", requireAuth, async (req, res) => {
  const post = db.prepare("SELECT id FROM posts WHERE id = ?").get(req.params.postId);
  if (!post) return res.status(404).json({ error: "Story not found." });
  const { body, media, parentId } = req.body || {};
  const cleanBody = String(body || "").trim();
  const att = Array.isArray(media) ? media : [];
  if (!cleanBody && !att.length) return res.status(400).json({ error: "Say something or attach media." });

  if (parentId) {
    const parent = db.prepare("SELECT id FROM comments WHERE id = ? AND post_id = ?").get(parentId, post.id);
    if (!parent) return res.status(404).json({ error: "Can't find that comment to reply to." });
  }

  if (cleanBody) {
    const check = await moderateText(cleanBody);
    if (check.status === "blocked") return res.status(422).json({ error: check.reason, categories: check.categories });
  }

  const id = "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const ts = Date.now();
  db.prepare(`
    INSERT INTO comments (id, post_id, parent_id, author_id, body, media, created_at)
    VALUES (@id, @post_id, @parent_id, @author_id, @body, @media, @created_at)
  `).run({ id, post_id: post.id, parent_id: parentId || null, author_id: req.user.id, body: cleanBody, media: JSON.stringify(att), created_at: ts });

  const row = db.prepare("SELECT * FROM comments WHERE id = ?").get(id);
  res.status(201).json({ comment: serializeComment(row, req.user.id) });
});

// POST /api/posts/:postId/comments/media — upload + moderate a comment attachment
router.post("/media", requireAuth, upload.single("file"), async (req, res) => {
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
