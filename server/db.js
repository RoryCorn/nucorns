const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, "nucorns.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  handle TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT,
  bio TEXT DEFAULT '',
  location TEXT DEFAULT '',
  interests TEXT DEFAULT '[]',
  avatar_grad TEXT DEFAULT '["#FFB24D","#FF6A1A"]',
  avatar_src TEXT,
  banner_grad TEXT DEFAULT '["#FFCB7A","#FF7A1A","#1FA8F0"]',
  is_admin INTEGER DEFAULT 0,
  is_demo INTEGER DEFAULT 0,
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  themes TEXT DEFAULT '[]',
  appearance TEXT DEFAULT '{}',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT DEFAULT '',
  title TEXT NOT NULL,
  dek TEXT DEFAULT '',
  body TEXT DEFAULT '[]',
  cover TEXT DEFAULT '[]',
  read_time TEXT DEFAULT '1 min',
  hearts INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  pinned INTEGER DEFAULT 0,
  unverified INTEGER DEFAULT 0,
  media TEXT DEFAULT '[]',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT DEFAULT '',
  media TEXT DEFAULT '[]',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  note TEXT DEFAULT '',
  created_at INTEGER NOT NULL,
  UNIQUE(target_type, target_id, user_id)
);

CREATE TABLE IF NOT EXISTS waves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  UNIQUE(from_user_id, to_user_id)
);

CREATE TABLE IF NOT EXISTS ad_requests (
  id TEXT PRIMARY KEY,
  company TEXT NOT NULL,
  contact TEXT NOT NULL,
  format TEXT NOT NULL,
  headline TEXT DEFAULT '',
  body TEXT DEFAULT '',
  url TEXT DEFAULT '',
  cta TEXT DEFAULT 'Learn more',
  media_src TEXT,
  preferred_slot TEXT DEFAULT 'convo',
  note TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ads (
  id TEXT PRIMARY KEY,
  company TEXT NOT NULL,
  format TEXT NOT NULL,
  headline TEXT DEFAULT '',
  body TEXT DEFAULT '',
  url TEXT DEFAULT '',
  cta TEXT DEFAULT 'Learn more',
  media_src TEXT,
  slot TEXT DEFAULT 'convo',
  live INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);
`);

function nowTs() { return Date.now(); }

// ---------- seed ----------
function seed() {
  const userCount = db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
  if (userCount > 0) return;

  const insertUser = db.prepare(`
    INSERT INTO users (handle, name, email, password_hash, bio, location, interests, avatar_grad, banner_grad, is_admin, is_demo, followers, following, themes, created_at)
    VALUES (@handle, @name, @email, @password_hash, @bio, @location, @interests, @avatar_grad, @banner_grad, @is_admin, @is_demo, @followers, @following, @themes, @created_at)
  `);

  const demoPassword = bcrypt.hashSync("nucorns-demo", 10);

  const creators = [
    {
      handle: "mayamakes", name: "Maya Okafor", email: "maya@nucorns.demo",
      bio: "Photographer chasing soft light. 30-day challenges, honest gear talk, and the occasional darkroom rabbit hole.",
      location: "Lisbon, PT",
      interests: ["Photography", "Analog", "Travel", "Coffee"],
      avatar_grad: ["#FFB24D", "#FF6A1A"], banner_grad: ["#FFCB7A", "#FF7A1A", "#1FA8F0"],
      followers: 18400, following: 312,
      themes: ["light", "photography", "patience", "frame", "gear", "essay", "algorithm", "overcast"],
      is_admin: 0,
    },
    {
      handle: "devinshoots", name: "Devin Park", email: "devin@nucorns.demo",
      bio: "Street & night photography. Neon, rain, and long exposures.",
      location: "Seoul, KR",
      interests: ["Photography", "Street", "Travel", "Analog"],
      avatar_grad: ["#6FD0FF", "#1B8BE0"], banner_grad: ["#6FD0FF", "#1B8BE0", "#7A5AF0"],
      followers: 9200, following: 180,
      themes: ["light", "photography", "street", "night", "film", "patience", "frame", "gear"],
      is_admin: 0,
    },
    {
      handle: "rinaroams", name: "Rina Solis", email: "rina@nucorns.demo",
      bio: "Slow travel diaries and the art of waiting for a moment.",
      location: "Oaxaca, MX",
      interests: ["Travel", "Photography", "Writing", "Coffee"],
      avatar_grad: ["#9BE7C4", "#2BB673"], banner_grad: ["#9BE7C4", "#2BB673", "#1FA8F0"],
      followers: 7600, following: 240,
      themes: ["travel", "slow", "moment", "patience", "light", "diary", "wait", "coffee"],
      is_admin: 0,
    },
    {
      handle: "theobuilds", name: "Theo B.", email: "theo@nucorns.demo",
      bio: "Essays on craft, process, and quitting the algorithm.",
      location: "Berlin, DE",
      interests: ["Writing", "Design", "Tech", "Books"],
      avatar_grad: ["#C9B6FF", "#7A5AF0"], banner_grad: ["#C9B6FF", "#7A5AF0", "#F0568F"],
      followers: 5400, following: 410,
      themes: ["essay", "process", "craft", "algorithm", "writing", "slow", "design", "making"],
      is_admin: 0,
    },
    {
      handle: "julesmari", name: "Jules Marigold", email: "jules@nucorns.demo",
      bio: "Film photographer & darkroom printer. Grain over pixels.",
      location: "Montréal, CA",
      interests: ["Photography", "Analog", "Illustration", "Music"],
      avatar_grad: ["#FF9EC4", "#F0568F"], banner_grad: ["#FFD27A", "#FF8A3D", "#F0568F"],
      followers: 3100, following: 96,
      themes: ["film", "darkroom", "print", "grain", "analog", "photography", "frame"],
      is_admin: 0,
    },
    {
      handle: "novakwrites", name: "Noor Vélez", email: "noor@nucorns.demo",
      bio: "Music writing, late-night playlists, and field recordings.",
      location: "Mexico City, MX",
      interests: ["Music", "Writing", "Tech", "Coffee"],
      avatar_grad: ["#FFD27A", "#FF8A3D"], banner_grad: ["#FFD27A", "#FF8A3D", "#F0568F"],
      followers: 2800, following: 188,
      themes: ["music", "sound", "playlist", "writing", "record", "night", "coffee"],
      is_admin: 0,
    },
    {
      handle: "imakefilms", name: "Sam Adeyemi", email: "sam@nucorns.demo",
      bio: "Short documentary films about ordinary, patient people.",
      location: "Lagos, NG",
      interests: ["Filmmaking", "Photography", "Travel", "Books"],
      avatar_grad: ["#7FE0D0", "#2BB6C2"], banner_grad: ["#9BE7C4", "#2BB673", "#1FA8F0"],
      followers: 4200, following: 150,
      themes: ["film", "documentary", "patience", "people", "story", "ordinary", "travel"],
      is_admin: 0,
    },
    {
      handle: "admin", name: "nucorns admin", email: "admin@nucorns.demo",
      bio: "Keeping the corner of the internet tidy.",
      location: "",
      interests: [],
      avatar_grad: ["#FFD27A", "#FF8A3D"], banner_grad: ["#FFD27A", "#FF8A3D", "#F0568F"],
      followers: 0, following: 0,
      themes: [],
      is_admin: 1,
    },
  ];

  const ids = {};
  const ts = nowTs();
  for (const c of creators) {
    const info = insertUser.run({
      handle: c.handle, name: c.name, email: c.email, password_hash: demoPassword,
      bio: c.bio, location: c.location,
      interests: JSON.stringify(c.interests),
      avatar_grad: JSON.stringify(c.avatar_grad), banner_grad: JSON.stringify(c.banner_grad),
      is_admin: c.is_admin, is_demo: 1,
      followers: c.followers, following: c.following,
      themes: JSON.stringify(c.themes),
      created_at: ts,
    });
    ids[c.handle] = info.lastInsertRowid;
  }

  const insertPost = db.prepare(`
    INSERT INTO posts (id, author_id, category, title, dek, body, cover, read_time, hearts, shares, pinned, created_at)
    VALUES (@id, @author_id, @category, @title, @dek, @body, @cover, @read_time, @hearts, @shares, @pinned, @created_at)
  `);

  const posts = [
    {
      id: "golden-hour", author: "mayamakes", category: "Field Notes", pinned: 1,
      title: "I spent 30 days shooting only at golden hour — here's what changed",
      dek: "A month of chasing the light taught me more about patience than any gear ever could. The full breakdown, the misses, and the three frames that made it worth it.",
      body: [
        "I made one rule for the month: if the sun wasn't within an hour of the horizon, the camera stayed in the bag. No exceptions, no \"just one quick frame.\" Thirty days of forced constraint.",
        "What I didn't expect was how much it slowed everything down. When you only have forty good minutes of light, you stop spraying frames and start actually seeing. You scout. You wait. You let a moment arrive instead of chasing it.",
        "Below is the gear, the routine, and the three frames that I'd put in a gallery tomorrow. Tell me which one you'd print — I'm genuinely torn.",
      ],
      cover: ["#FFCB7A", "#FF7A1A", "#1FA8F0"], readTime: "6 min", hearts: 2840, shares: 312,
      ts: ts - 1000 * 60 * 60 * 24 * 2,
    },
    {
      id: "gear", author: "mayamakes", category: "Gear", pinned: 0,
      title: "The gear I actually carry (and the expensive things I left at home)",
      dek: "One body, two primes, and a notebook. Why my kit keeps getting smaller every year.",
      body: [
        "Every year my bag gets lighter. This year it's down to one body, two primes, and a notebook — and I haven't missed a single shot because of it.",
        "Here's exactly what's in the bag, what stays home, and the one \"essential\" purchase I regret.",
      ],
      cover: ["#6FD0FF", "#1B8BE0"], readTime: "8 min", hearts: 1290, shares: 88,
      ts: ts - 1000 * 60 * 60 * 24 * 16,
    },
    {
      id: "algorithm", author: "mayamakes", category: "Essay", pinned: 0,
      title: "I quit the algorithm for a season — here's what came back",
      dek: "Ninety days off the feed. The work got quieter, slower, and somehow far more mine.",
      body: [
        "Ninety days ago I turned off every recommendation feed I could find. No explore page, no For You, no suggested-for-you anything.",
        "The work that came back was quieter. Slower. And — to my surprise — far more mine than anything I'd made chasing a feed.",
      ],
      cover: ["#C9B6FF", "#7A5AF0"], readTime: "5 min", hearts: 3610, shares: 540,
      ts: ts - 1000 * 60 * 60 * 24 * 38,
    },
    {
      id: "overcast", author: "mayamakes", category: "Field Notes", pinned: 0,
      title: "A love letter to overcast days",
      dek: "Flat light is not bad light. A short defense of the gloom every photographer secretly loves.",
      body: [
        "Flat light gets a bad rap. No dramatic shadows, no golden rim — just a soft, even gray that a lot of photographers learn to dread.",
        "I've come around to it completely. Here's my short defense of the gloom.",
      ],
      cover: ["#9BE7C4", "#2BB673"], readTime: "4 min", hearts: 980, shares: 64,
      ts: ts - 1000 * 60 * 60 * 24 * 57,
    },
  ];

  for (const p of posts) {
    insertPost.run({
      id: p.id, author_id: ids[p.author], category: p.category, title: p.title, dek: p.dek,
      body: JSON.stringify(p.body), cover: JSON.stringify(p.cover), read_time: p.readTime,
      hearts: p.hearts, shares: p.shares, pinned: p.pinned, created_at: p.ts,
    });
  }

  const insertComment = db.prepare(`
    INSERT INTO comments (id, post_id, parent_id, author_id, body, media, created_at)
    VALUES (@id, @post_id, @parent_id, @author_id, @body, @media, @created_at)
  `);

  const comments = [
    { id: "c1", post_id: "golden-hour", parent_id: null, author: "devinshoots",
      body: "Frame two is the one. That rim light on the left edge is doing SO much. Did you meter for the highlights or just trust the histogram?",
      media: [{ kind: "photo", grad: ["#FFD79E", "#FF8A3D"], label: "rim-light-ref.jpg" }],
      ts: ts - 1000 * 60 * 60 * 3, likes: 128 },
    { id: "c1r1", post_id: "golden-hour", parent_id: "c1", author: "mayamakes",
      body: "Trusted the histogram and underexposed about ⅔ stop on purpose — pulled it back in post. The edge would've blown out otherwise.",
      media: [], ts: ts - 1000 * 60 * 60 * 2, likes: 41 },
    { id: "c2", post_id: "golden-hour", parent_id: null, author: "rinaroams",
      body: "Okay the patience point hit hard. I recorded my own golden-hour wait the other day — this is what \"letting a moment arrive\" actually looks like 😅",
      media: [{ kind: "video", grad: ["#9BE7C4", "#1B8BE0"], label: "the-wait.mp4", dur: "0:18" }],
      ts: ts - 1000 * 60 * 60 * 4, likes: 86 },
    { id: "c3", post_id: "golden-hour", parent_id: null, author: "theobuilds",
      body: "This pairs really well with that Sean Tucker essay on slowing down. Dropping it here for anyone who wants the long version of the same idea.",
      media: [{ kind: "link", url: "https://seantucker.photo/the-meaning-in-the-making", title: "The Meaning in the Making — on patience & process", site: "seantucker.photo" }],
      ts: ts - 1000 * 60 * 60 * 5, likes: 52 },
    { id: "c4", post_id: "golden-hour", parent_id: null, author: "julesmari",
      body: "Printing frame three. No notes. The way the shadow cuts the foreground is unreal.",
      media: [], ts: ts - 1000 * 60 * 60 * 6, likes: 19 },
  ];

  const insertReaction = db.prepare(`
    INSERT OR IGNORE INTO reactions (target_type, target_id, user_id, value, note, created_at)
    VALUES (@target_type, @target_id, @user_id, @value, '', @created_at)
  `);

  for (const c of comments) {
    insertComment.run({
      id: c.id, post_id: c.post_id, parent_id: c.parent_id, author_id: ids[c.author],
      body: c.body, media: JSON.stringify(c.media), created_at: c.ts,
    });
    // seed "up" reactions from a spread of demo creators so counts feel alive
    const voters = Object.keys(ids).filter((h) => h !== c.author).slice(0, Math.min(6, Math.round(c.likes / 25) || 1));
    voters.forEach((h, i) => {
      insertReaction.run({ target_type: "comment", target_id: c.id, user_id: ids[h], value: i % 9 === 0 ? "mixed" : "up", created_at: c.ts });
    });
  }
  // seed reactions on the post itself
  const postVoters = Object.keys(ids).filter((h) => h !== "mayamakes");
  postVoters.forEach((h, i) => {
    insertReaction.run({ target_type: "post", target_id: "golden-hour", user_id: ids[h], value: i % 5 === 0 ? "mixed" : "up", created_at: ts });
  });
}

seed();

module.exports = db;
