// nucorns — content safety + image utilities.
// Text: fast local backstop for obvious threats/self-harm, then AI classification
// (hate / racism / harassment / sexual-explicit) via window.claude.complete.
// Images: a client-side skin-coverage pre-check that flags likely-explicit photos.

const NU_GUIDELINES = [
  { icon: "heart", title: "Be kind & human", body: "No harassment, hateful, or racist language. Critique work, not people." },
  { icon: "close", title: "No explicit nudity", body: "Photos and videos containing full nudity or sexual content won't be posted." },
  { icon: "check", title: "Make it yours", body: "Share your own work, credit others, and keep it real." },
];

/* ---------- fast local backstop (no slurs embedded; covers obvious harm) ---------- */
function nuNormalize(s) {
  return (s || "").toLowerCase()
    .replace(/[4@]/g, "a").replace(/[3]/g, "e").replace(/[1!|]/g, "i")
    .replace(/[0]/g, "o").replace(/[\$5]/g, "s").replace(/[7]/g, "t")
    .replace(/(.)\1{2,}/g, "$1$1");
}
const NU_LOCAL_HARM = [
  /\bk+y+s+\b/, /\bkill (your|ur)\s?self\b/, /\bkill (your|ur)\s?selves\b/,
  /\bgo (and )?die\b/, /\bi('?| wi)ll (kill|hurt|find) you\b/, /\byou should die\b/,
];
function localScan(text) {
  const n = nuNormalize(text);
  for (const re of NU_LOCAL_HARM) {
    if (re.test(n)) return { allow: false, categories: ["self-harm / threats"], reason: "This reads as a threat or encourages self-harm, which isn't allowed here." };
  }
  return null;
}

/* ---------- AI classification ---------- */
async function aiClassify(text) {
  if (!window.claude || !window.claude.complete) return null;
  const prompt =
    "You are a content-safety classifier for a creator blog platform called nucorns.\n" +
    "Community rules: (1) NO racist, hateful language, or slurs; (2) NO harassment, threats, or calls for violence; (3) NO sexually explicit text.\n" +
    "Classify the USER CONTENT below. Reply with ONLY compact JSON, no prose:\n" +
    '{"allow": boolean, "categories": string[], "reason": string}\n' +
    "If allow is false, reason must be one short friendly sentence addressed to the author explaining what to change. If allow is true, reason is \"\".\n" +
    "USER CONTENT:\n<<<\n" + text + "\n>>>";
  try {
    const raw = await window.claude.complete(prompt);
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const v = JSON.parse(m[0]);
    return { allow: !!v.allow, categories: v.categories || [], reason: v.reason || "" };
  } catch (e) { return null; }
}

// returns {status:'ok'|'blocked'|'unverified', categories, reason}
async function moderateText(text) {
  if (!text || !text.trim()) return { status: "ok", categories: [], reason: "" };
  const local = localScan(text);
  if (local) return { status: "blocked", categories: local.categories, reason: local.reason };
  const ai = await aiClassify(text);
  if (!ai) return { status: "ok", categories: [], reason: "", unverified: true };
  if (ai.allow) return { status: "ok", categories: [], reason: "" };
  return { status: "blocked", categories: ai.categories, reason: ai.reason || "This doesn't meet our community guidelines." };
}

/* ---------- image: downscale for storage + explicit pre-check ---------- */
function loadImageFromFile(file) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}

// downscale to a storable jpeg data URL
function imageToDataURL(img, maxDim = 720, quality = 0.82) {
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  c.getContext("2d").drawImage(img, 0, 0, w, h);
  return c.toDataURL("image/jpeg", quality);
}

// naive skin-coverage heuristic → fraction of pixels that look like skin
function skinRatio(img) {
  const dim = 96;
  const scale = Math.min(1, dim / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale));
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const ctx = c.getContext("2d"); ctx.drawImage(img, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  let skin = 0, total = 0;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
    if (a < 125) continue;
    total++;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (r > 95 && g > 40 && b > 20 && (mx - mn) > 15 && Math.abs(r - g) > 15 && r > g && r > b) skin++;
  }
  return total ? skin / total : 0;
}

// returns {status:'ok'|'blocked', score, dataUrl, reason}
async function moderateImageFile(file, opts = {}) {
  const isVideo = (file.type || "").startsWith("video");
  if (isVideo) {
    // videos aren't scanned client-side in this prototype; store object URL, allow
    return { status: "ok", score: 0, dataUrl: URL.createObjectURL(file), video: true };
  }
  let img;
  try { img = await loadImageFromFile(file); }
  catch (e) { return { status: "blocked", score: 1, reason: "Couldn't read that image." }; }
  const nameFlag = /nude|nsfw|explicit|porn/i.test(file.name || "");
  const ratio = skinRatio(img);
  const threshold = opts.threshold != null ? opts.threshold : 0.72;
  const dataUrl = imageToDataURL(img, opts.maxDim || 720);
  if (nameFlag || ratio >= threshold) {
    return { status: "blocked", score: ratio, dataUrl,
      reason: "This photo was automatically flagged as possibly explicit. Photos with full nudity can't be posted." };
  }
  return { status: "ok", score: ratio, dataUrl };
}

Object.assign(window, { NU_GUIDELINES, moderateText, moderateImageFile, imageToDataURL, loadImageFromFile, skinRatio });
