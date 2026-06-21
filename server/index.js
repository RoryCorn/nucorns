require("dotenv").config({ quiet: true });
const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");
const compression = require("compression");

const { attachUser } = require("./auth");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const postRoutes = require("./routes/posts");
const commentRoutes = require("./routes/comments");
const reactionRoutes = require("./routes/reactions");
const matchRoutes = require("./routes/matches");
const adRoutes = require("./routes/ads");
const messageRoutes = require("./routes/messages");
const groupRoutes = require("./routes/groups");

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const IS_PROD = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);
app.use(compression());
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(
  cookieSession({
    name: "nucorns.sid",
    secret: process.env.SESSION_SECRET || "nucorns-dev-secret-change-me",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    sameSite: "lax",
    secure: IS_PROD,
  })
);
app.use(attachUser);

// Health check — used by uptime monitors to prevent cold starts
app.get("/api/health", (req, res) => res.json({ ok: true }));

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "uploads");
app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "7d" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/posts/:postId/comments", commentRoutes);
app.use("/api/reactions", reactionRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/ads", adRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);

app.use("/api", (req, res) => res.status(404).json({ error: "Not found." }));

if (IS_PROD) {
  const clientDist = path.join(__dirname, "..", "client", "dist");
  // Cache hashed assets (JS/CSS) for 1 year; HTML never cached
  app.use("/assets", express.static(path.join(clientDist, "assets"), { maxAge: "1y", immutable: true }));
  app.use(express.static(clientDist, { maxAge: 0 }));
  app.get(/^\/(?!uploads).*/, (req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

app.use((err, req, res, next) => {
  if (err && err.name === "MulterError") return res.status(400).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: "Something went wrong." });
});

app.listen(PORT, () => {
  console.log(`nucorns API listening on http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("ANTHROPIC_API_KEY not set — moderation will run in 'unverified' fallback mode.");
  }
});
