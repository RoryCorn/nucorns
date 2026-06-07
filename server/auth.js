const db = require("./db");

function serializeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    handle: row.handle,
    name: row.name,
    bio: row.bio,
    location: row.location,
    interests: JSON.parse(row.interests || "[]"),
    avatarGrad: JSON.parse(row.avatar_grad || "[]"),
    avatarSrc: row.avatar_src || null,
    bannerGrad: JSON.parse(row.banner_grad || "[]"),
    isAdmin: !!row.is_admin,
    isDemo: !!row.is_demo,
    followers: row.followers,
    following: row.following,
    appearance: JSON.parse(row.appearance || "{}"),
    joined: new Date(row.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    createdAt: row.created_at,
  };
}

function getUserById(id) {
  if (!id) return null;
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}

function getUserByHandle(handle) {
  return db.prepare("SELECT * FROM users WHERE handle = ?").get(handle);
}

// Attaches req.user (raw row) and req.currentUser (serialized) when a session exists.
function attachUser(req, res, next) {
  const uid = req.session && req.session.userId;
  const row = uid ? getUserById(uid) : null;
  req.user = row || null;
  req.currentUser = row ? serializeUser(row) : null;
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Sign in required." });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Sign in required." });
  if (!req.user.is_admin) return res.status(403).json({ error: "Admin access only." });
  next();
}

module.exports = { serializeUser, getUserById, getUserByHandle, attachUser, requireAuth, requireAdmin };
