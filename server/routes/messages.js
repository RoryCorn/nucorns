const express = require("express");
const db = require("../db");
const { serializeUser, getUserById, getUserByHandle, requireAuth } = require("../auth");
const { moderateText } = require("../lib/moderation");

const router = express.Router();

function serializeMsg(row) {
  return { id: row.id, fromUserId: row.from_user_id, toUserId: row.to_user_id, body: row.body, read: !!row.read, createdAt: row.created_at };
}

function briefUser(row) {
  if (!row) return null;
  return { id: row.id, handle: row.handle, name: row.name, avatarGrad: JSON.parse(row.avatar_grad || "[]"), avatarSrc: row.avatar_src, isAdmin: !!row.is_admin };
}

// GET /api/messages/unread — total unread count
router.get("/unread", requireAuth, (req, res) => {
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM messages WHERE to_user_id = ? AND read = 0").get(req.user.id);
  res.json({ count: n });
});

// GET /api/messages/conversations — list conversation partners with latest msg
router.get("/conversations", requireAuth, (req, res) => {
  const uid = req.user.id;
  const rows = db.prepare(`
    SELECT m.*,
      CASE WHEN m.from_user_id = ? THEN m.to_user_id ELSE m.from_user_id END AS partner_id
    FROM messages m
    INNER JOIN (
      SELECT MAX(created_at) AS max_ts,
        CASE WHEN from_user_id = ? THEN to_user_id ELSE from_user_id END AS pid
      FROM messages WHERE from_user_id = ? OR to_user_id = ?
      GROUP BY pid
    ) latest ON (CASE WHEN m.from_user_id = ? THEN m.to_user_id ELSE m.from_user_id END) = latest.pid
              AND m.created_at = latest.max_ts
    ORDER BY m.created_at DESC
  `).all(uid, uid, uid, uid, uid);

  const convos = rows.map((r) => {
    const partner = getUserById(r.partner_id);
    const unread = db.prepare("SELECT COUNT(*) AS n FROM messages WHERE from_user_id = ? AND to_user_id = ? AND read = 0").get(r.partner_id, uid).n;
    return { partner: briefUser(partner), lastMessage: serializeMsg(r), unread };
  });
  res.json({ conversations: convos });
});

// GET /api/messages/:handle — thread with a specific user
router.get("/:handle", requireAuth, (req, res) => {
  const other = getUserByHandle(String(req.params.handle).toLowerCase());
  if (!other) return res.status(404).json({ error: "User not found." });
  const uid = req.user.id;

  const rows = db.prepare(`
    SELECT * FROM messages
    WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?)
    ORDER BY created_at ASC
  `).all(uid, other.id, other.id, uid);

  // Mark as read
  db.prepare("UPDATE messages SET read = 1 WHERE from_user_id = ? AND to_user_id = ? AND read = 0").run(other.id, uid);

  res.json({ messages: rows.map(serializeMsg), partner: briefUser(other) });
});

// POST /api/messages/:handle — send a message
router.post("/:handle", requireAuth, async (req, res) => {
  const other = getUserByHandle(String(req.params.handle).toLowerCase());
  if (!other) return res.status(404).json({ error: "User not found." });
  if (other.id === req.user.id) return res.status(400).json({ error: "You can't message yourself." });

  const body = String(req.body.body || "").trim();
  if (!body) return res.status(400).json({ error: "Message can't be empty." });
  if (body.length > 2000) return res.status(400).json({ error: "Message too long (max 2000 chars)." });

  const check = await moderateText(body);
  if (check.status === "blocked") return res.status(422).json({ error: check.reason });

  const id = "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  db.prepare("INSERT INTO messages (id, from_user_id, to_user_id, body, read, created_at) VALUES (?, ?, ?, ?, 0, ?)").run(id, req.user.id, other.id, body, Date.now());

  const row = db.prepare("SELECT * FROM messages WHERE id = ?").get(id);
  res.status(201).json({ message: serializeMsg(row) });
});

module.exports = router;
