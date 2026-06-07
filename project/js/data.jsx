// Seed data + tiny helpers for the nucorns comment prototype.
// Assigned to window so other babel scripts can use them.

const NU_AVATARS = {
  maya:   { name: "Maya Okafor",   handle: "mayamakes",     grad: ["#FFB24D", "#FF6A1A"] },
  devin:  { name: "Devin Park",    handle: "devinshoots",   grad: ["#6FD0FF", "#1B8BE0"] },
  rina:   { name: "Rina Solis",    handle: "rinaroams",     grad: ["#9BE7C4", "#2BB673"] },
  theo:   { name: "Theo B·",       handle: "theobuilds",    grad: ["#C9B6FF", "#7A5AF0"] },
  you:    { name: "You",           handle: "you",           grad: ["#FFD27A", "#FF8A3D"] },
  jules:  { name: "Jules Marigold",handle: "julesmari",     grad: ["#FF9EC4", "#F0568F"] },
};

// The post being read — a creator's photo-essay.
const NU_POST = {
  author: "maya",
  date: "Jun 5, 2026",
  readTime: "6 min read",
  category: "Field Notes",
  title: "I spent 30 days shooting only at golden hour — here's what changed",
  dek: "A month of chasing the light taught me more about patience than any gear ever could. The full breakdown, the misses, and the three frames that made it worth it.",
  hero: ["#FFCB7A", "#FF7A1A", "#1FA8F0"],
  body: [
    "I made one rule for the month: if the sun wasn't within an hour of the horizon, the camera stayed in the bag. No exceptions, no \"just one quick frame.\" Thirty days of forced constraint.",
    "What I didn't expect was how much it slowed everything down. When you only have forty good minutes of light, you stop spraying frames and start actually seeing. You scout. You wait. You let a moment arrive instead of chasing it.",
    "Below is the gear, the routine, and the three frames that I'd put in a gallery tomorrow. Tell me which one you'd print — I'm genuinely torn.",
  ],
  stats: { hearts: 2840, comments: 0, shares: 312 },
};

// Seed conversation — varied media so every comment type is represented.
const NU_COMMENTS = [
  {
    id: "c1",
    author: "devin",
    time: "3h",
    likes: 128,
    liked: false,
    body: "Frame two is the one. That rim light on the left edge is doing SO much. Did you meter for the highlights or just trust the histogram?",
    media: [{ kind: "photo", grad: ["#FFD79E", "#FF8A3D"], label: "rim-light-ref.jpg" }],
    replies: [
      {
        id: "c1r1",
        author: "maya",
        time: "2h",
        likes: 41,
        liked: false,
        body: "Trusted the histogram and underexposed about ⅔ stop on purpose — pulled it back in post. The edge would've blown out otherwise.",
        media: [],
      },
    ],
  },
  {
    id: "c2",
    author: "rina",
    time: "4h",
    likes: 86,
    liked: true,
    body: "Okay the patience point hit hard. I recorded my own golden-hour wait the other day — this is what \"letting a moment arrive\" actually looks like 😅",
    media: [{ kind: "video", grad: ["#9BE7C4", "#1B8BE0"], label: "the-wait.mp4", dur: "0:18" }],
    replies: [],
  },
  {
    id: "c3",
    author: "theo",
    time: "5h",
    likes: 52,
    liked: false,
    body: "This pairs really well with that Sean Tucker essay on slowing down. Dropping it here for anyone who wants the long version of the same idea.",
    media: [{ kind: "link", url: "https://seantucker.photo/the-meaning-in-the-making", title: "The Meaning in the Making — on patience & process", site: "seantucker.photo" }],
    replies: [],
  },
  {
    id: "c4",
    author: "jules",
    time: "6h",
    likes: 19,
    liked: false,
    body: "Printing frame three. No notes. The way the shadow cuts the foreground is unreal.",
    media: [],
    replies: [],
  },
];

function nuInitials(name) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join("").toUpperCase();
}

function nuFmt(n) {
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 >= 100 ? 1 : 0).replace(/\.0$/, "") + "k";
  return String(n);
}

Object.assign(window, { NU_AVATARS, NU_POST, NU_COMMENTS, nuInitials, nuFmt });
