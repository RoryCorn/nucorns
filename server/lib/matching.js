// "Creators you might vibe with" — score candidates by shared interests and
// shared theme keywords pulled from the viewer's bio + story titles/deks.

const NU_STOP = new Set(
  "the a an and or of to in on for with my our your this that you me it is are was were be been about into over only just here there their they them what when which who how why not can will"
    .split(" ")
);

function nuTokens(str) {
  return (str || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !NU_STOP.has(w));
}

// profile: {handle, interests, bio}; stories: [{title, dek}]; candidates: [{id, handle, name, themes, interests, ...}]
function nuTopMatches(profile, stories, candidates, n = 3) {
  const myInterests = new Set((profile.interests || []).map((s) => s.toLowerCase()));
  const text = [profile.bio, ...(stories || []).flatMap((s) => [s.title, s.dek])].join(" ");
  const myWords = new Set(nuTokens(text));
  const me = profile.handle;
  const scored = candidates
    .filter((c) => c.handle !== me)
    .map((c) => {
      const shared = (c.interests || []).filter((i) => myInterests.has(i.toLowerCase()));
      const themeHits = (c.themes || []).filter((th) => myWords.has(th));
      const score = shared.length * 3 + themeHits.length;
      return { c, score, shared, themeHits };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, n);
}

module.exports = { nuTopMatches, nuTokens };
