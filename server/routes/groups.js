const express = require("express");
const db = require("../db");
const { getUserById, requireAuth } = require("../auth");
const { moderateText } = require("../lib/moderation");

const router = express.Router();

function serializeGroup(row, userId) {
  const creator = getUserById(row.creator_id);
  const isMember = userId
    ? !!db.prepare("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?").get(row.id, userId)
    : false;
  return {
    id: row.id, name: row.name, slug: row.slug,
    description: row.description, memberCount: row.member_count,
    creator: creator ? { id: creator.id, handle: creator.handle, name: creator.name } : null,
    isMember, createdAt: row.created_at,
  };
}

function toSlug(name) {
  return name.replace(/^#/, "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
}

// GET /api/groups — list all groups
router.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM groups ORDER BY member_count DESC, created_at DESC").all();
  const uid = req.user ? req.user.id : null;
  res.json({ groups: rows.map((r) => serializeGroup(r, uid)) });
});

// POST /api/groups — create a group
router.post("/", requireAuth, async (req, res) => {
  const rawName = String(req.body.name || "").trim();
  const name = rawName.startsWith("#") ? rawName : "#" + rawName;
  const slug = toSlug(name);
  if (slug.length < 2) return res.status(400).json({ error: "Group name must be at least 2 characters." });

  const existing = db.prepare("SELECT id FROM groups WHERE slug = ?").get(slug);
  if (existing) return res.status(400).json({ error: "A group with that name already exists." });

  const description = String(req.body.description || "").trim().slice(0, 200);
  const check = await moderateText(name + " " + description);
  if (check.status === "blocked") return res.status(422).json({ error: check.reason });

  const info = db.prepare("INSERT INTO groups (name, slug, description, creator_id, member_count, created_at) VALUES (?, ?, ?, ?, 1, ?)").run(name, slug, description, req.user.id, Date.now());
  db.prepare("INSERT INTO group_members (group_id, user_id, created_at) VALUES (?, ?, ?)").run(info.lastInsertRowid, req.user.id, Date.now());

  const row = db.prepare("SELECT * FROM groups WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json({ group: serializeGroup(row, req.user.id) });
});

// GET /api/groups/:slug — group detail
router.get("/:slug", (req, res) => {
  const row = db.prepare("SELECT * FROM groups WHERE slug = ?").get(req.params.slug);
  if (!row) return res.status(404).json({ error: "Group not found." });
  const uid = req.user ? req.user.id : null;
  res.json({ group: serializeGroup(row, uid) });
});

// POST /api/groups/:slug/join
router.post("/:slug/join", requireAuth, (req, res) => {
  const row = db.prepare("SELECT * FROM groups WHERE slug = ?").get(req.params.slug);
  if (!row) return res.status(404).json({ error: "Group not found." });
  const already = db.prepare("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?").get(row.id, req.user.id);
  if (already) return res.json({ ok: true });
  db.prepare("INSERT INTO group_members (group_id, user_id, created_at) VALUES (?, ?, ?)").run(row.id, req.user.id, Date.now());
  db.prepare("UPDATE groups SET member_count = member_count + 1 WHERE id = ?").run(row.id);
  res.json({ ok: true });
});

// POST /api/groups/:slug/leave
router.post("/:slug/leave", requireAuth, (req, res) => {
  const row = db.prepare("SELECT * FROM groups WHERE slug = ?").get(req.params.slug);
  if (!row) return res.status(404).json({ error: "Group not found." });
  const was = db.prepare("DELETE FROM group_members WHERE group_id = ? AND user_id = ?").run(row.id, req.user.id);
  if (was.changes) db.prepare("UPDATE groups SET member_count = MAX(0, member_count - 1) WHERE id = ?").run(row.id);
  res.json({ ok: true });
});

// GET /api/groups/:slug/posts — posts tagged in this group
router.get("/:slug/posts", (req, res) => {
  const row = db.prepare("SELECT * FROM groups WHERE slug = ?").get(req.params.slug);
  if (!row) return res.status(404).json({ error: "Group not found." });
  const postIds = db.prepare("SELECT post_id FROM post_groups WHERE group_id = ?").all(row.id).map((r) => r.post_id);
  if (postIds.length === 0) return res.json({ posts: [] });
  const placeholders = postIds.map(() => "?").join(",");
  const posts = db.prepare(`SELECT * FROM posts WHERE id IN (${placeholders}) ORDER BY created_at DESC`).all(...postIds);

  const { serializeUser: _su, getUserById: gu } = require("../auth");
  function fmtDate(ts) { return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  const uid = req.user ? req.user.id : null;
  const serialized = posts.map((p) => {
    const author = gu(p.author_id);
    const commentCount = db.prepare("SELECT COUNT(*) AS n FROM comments WHERE post_id = ?").get(p.id).n;
    const postGroups = db.prepare("SELECT g.name, g.slug FROM post_groups pg JOIN groups g ON pg.group_id = g.id WHERE pg.post_id = ?").all(p.id);
    return {
      id: p.id,
      author: author ? { id: author.id, handle: author.handle, name: author.name, avatarGrad: JSON.parse(author.avatar_grad || "[]"), avatarSrc: author.avatar_src, isAdmin: !!author.is_admin } : null,
      mine: uid ? p.author_id === uid : false,
      category: p.category, title: p.title, dek: p.dek,
      body: JSON.parse(p.body || "[]"), cover: JSON.parse(p.cover || "[]"),
      media: JSON.parse(p.media || "[]"), date: fmtDate(p.created_at),
      readTime: p.read_time, hearts: p.hearts, shares: p.shares,
      comments: commentCount, pinned: !!p.pinned, createdAt: p.created_at,
      groups: postGroups,
    };
  });
  res.json({ posts: serialized });
});

module.exports = router;
