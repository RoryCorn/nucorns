// Lightweight, naive nudity pre-check (skin-tone pixel ratio), ported from the
// prototype's canvas-based heuristic to run server-side with sharp. This is a
// heuristic, not a real classifier — flags likely-explicit photos for review
// and blocks obvious cases; a production system would pair it with a real
// server-side image-safety model.
const sharp = require("sharp");

const DIM = 96;
const DEFAULT_THRESHOLD = 0.72;

async function skinRatio(buffer) {
  const { data, info } = await sharp(buffer)
    .resize(DIM, DIM, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let skin = 0;
  let total = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 125) continue;
    total++;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (r > 95 && g > 40 && b > 20 && (mx - mn) > 15 && Math.abs(r - g) > 15 && r > g && r > b) skin++;
  }
  return total ? skin / total : 0;
}

// returns {status:'ok'|'blocked', score, reason}
async function moderateImageBuffer(buffer, originalName, opts = {}) {
  const nameFlag = /nude|nsfw|explicit|porn/i.test(originalName || "");
  let ratio = 0;
  try {
    ratio = await skinRatio(buffer);
  } catch (e) {
    return { status: "blocked", score: 1, reason: "Couldn't read that image." };
  }
  const threshold = opts.threshold != null ? opts.threshold : DEFAULT_THRESHOLD;
  if (nameFlag || ratio >= threshold) {
    return {
      status: "blocked", score: ratio,
      reason: "This photo was automatically flagged as possibly explicit. Photos with full nudity can't be posted.",
    };
  }
  return { status: "ok", score: ratio };
}

module.exports = { moderateImageBuffer };
