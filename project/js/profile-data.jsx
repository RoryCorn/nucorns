// Profile + posts seed for nucorns. Signup writes to localStorage('nucorns_profile');
// the profile page merges it over this demo creator so the flow feels connected.

const NU_INTERESTS = [
  "Photography", "Filmmaking", "Writing", "Travel", "Design", "Music",
  "Food", "Fitness", "Tech", "Illustration", "Nature", "Fashion",
  "Gaming", "Books", "Coffee", "Architecture", "Street", "Analog",
];

// Default demo creator (used when no signup has happened yet).
const NU_PROFILE_DEFAULT = {
  name: "Maya Okafor",
  handle: "mayamakes",
  bio: "Photographer chasing soft light. 30-day challenges, honest gear talk, and the occasional darkroom rabbit hole.",
  interests: ["Photography", "Analog", "Travel", "Coffee"],
  avatarGrad: ["#FFB24D", "#FF6A1A"],
  bannerGrad: ["#FFCB7A", "#FF7A1A", "#1FA8F0"],
  location: "Lisbon, PT",
  joined: "Joined 2024",
  followers: 18400,
  following: 312,
};

// The blog posts hosted on the profile.
const NU_POSTS = [
  {
    id: "golden-hour",
    href: "nucorns — Conversation.html",
    category: "Field Notes",
    title: "I spent 30 days shooting only at golden hour — here's what changed",
    dek: "A month of chasing the light taught me more about patience than any gear ever could.",
    cover: ["#FFCB7A", "#FF7A1A", "#1FA8F0"],
    date: "Jun 5, 2026", readTime: "6 min",
    hearts: 2840, comments: 5, shares: 312, pinned: true,
  },
  {
    id: "gear",
    category: "Gear",
    title: "The gear I actually carry (and the expensive things I left at home)",
    dek: "One body, two primes, and a notebook. Why my kit keeps getting smaller every year.",
    cover: ["#6FD0FF", "#1B8BE0"],
    date: "May 22, 2026", readTime: "8 min",
    hearts: 1290, comments: 47, shares: 88,
  },
  {
    id: "algorithm",
    category: "Essay",
    title: "I quit the algorithm for a season — here's what came back",
    dek: "Ninety days off the feed. The work got quieter, slower, and somehow far more mine.",
    cover: ["#C9B6FF", "#7A5AF0"],
    date: "Apr 30, 2026", readTime: "5 min",
    hearts: 3610, comments: 132, shares: 540,
  },
  {
    id: "overcast",
    category: "Field Notes",
    title: "A love letter to overcast days",
    dek: "Flat light is not bad light. A short defense of the gloom every photographer secretly loves.",
    cover: ["#9BE7C4", "#2BB673"],
    date: "Apr 11, 2026", readTime: "4 min",
    hearts: 980, comments: 21, shares: 64,
  },
];

function nuLoadProfile() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem("nucorns_profile") || "{}"); } catch (e) {}
  const p = Object.assign({}, NU_PROFILE_DEFAULT, saved || {});
  // a freshly-created profile starts fresh
  if (saved && saved.name) {
    p.isYou = true;
    if (saved.followers == null) p.followers = 0;
    if (saved.following == null) p.following = 0;
    if (!saved.location) p.location = "";
    p.joined = "Joined 2026";
  }
  return p;
}

function nuSaveProfile(p) {
  try { localStorage.setItem("nucorns_profile", JSON.stringify(p)); } catch (e) {}
}

function nuLoadStories() {
  try { return JSON.parse(localStorage.getItem("nucorns_stories") || "[]"); } catch (e) { return []; }
}
function nuSaveStory(story) {
  const all = nuLoadStories();
  all.unshift(story);
  try { localStorage.setItem("nucorns_stories", JSON.stringify(all)); } catch (e) {
    // storage full (large images) — drop oldest and retry once
    try { all.pop(); localStorage.setItem("nucorns_stories", JSON.stringify(all)); } catch (e2) {}
  }
}

Object.assign(window, { NU_INTERESTS, NU_PROFILE_DEFAULT, NU_POSTS, nuLoadProfile, nuSaveProfile, nuLoadStories, nuSaveStory });
