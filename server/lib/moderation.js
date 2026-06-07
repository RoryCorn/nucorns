// Content safety: fast local backstop for obvious threats/self-harm, then
// real AI classification (hate / racism / harassment / sexual-explicit) via
// the Anthropic Messages API. Falls back to "unverified, allowed" if no
// ANTHROPIC_API_KEY is configured so the product still works without one.

const NU_GUIDELINES = [
  { icon: "heart", title: "Be kind & human", body: "No harassment, hateful, or racist language. Critique work, not people." },
  { icon: "close", title: "No explicit nudity", body: "Photos and videos containing full nudity or sexual content won't be posted." },
  { icon: "check", title: "Make it yours", body: "Share your own work, credit others, and keep it real." },
];

function nuNormalize(s) {
  return (s || "").toLowerCase()
    .replace(/[4@]/g, "a").replace(/[3]/g, "e").replace(/[1!|]/g, "i")
    .replace(/[0]/g, "o").replace(/[$5]/g, "s").replace(/[7]/g, "t")
    .replace(/(.)\1{2,}/g, "$1$1");
}

const NU_LOCAL_HARM = [
  /\bk+y+s+\b/, /\bkill (your|ur)\s?self\b/, /\bkill (your|ur)\s?selves\b/,
  /\bgo (and )?die\b/, /\bi('?| wi)ll (kill|hurt|find) you\b/, /\byou should die\b/,
];

function localScan(text) {
  const n = nuNormalize(text);
  for (const re of NU_LOCAL_HARM) {
    if (re.test(n)) {
      return { allow: false, categories: ["self-harm / threats"], reason: "This reads as a threat or encourages self-harm, which isn't allowed here." };
    }
  }
  return null;
}

let _anthropic = null;
function getClient() {
  if (_anthropic !== null) return _anthropic;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { _anthropic = false; return _anthropic; }
  try {
    const Anthropic = require("@anthropic-ai/sdk");
    _anthropic = new Anthropic({ apiKey });
  } catch (e) {
    _anthropic = false;
  }
  return _anthropic;
}

async function aiClassify(text) {
  const client = getClient();
  if (!client) return null;
  const prompt =
    "You are a content-safety classifier for a creator blog platform called nucorns.\n" +
    "Community rules: (1) NO racist, hateful language, or slurs; (2) NO harassment, threats, or calls for violence; (3) NO sexually explicit text.\n" +
    "Classify the USER CONTENT below. Reply with ONLY compact JSON, no prose:\n" +
    '{"allow": boolean, "categories": string[], "reason": string}\n' +
    "If allow is false, reason must be one short friendly sentence addressed to the author explaining what to change. If allow is true, reason is \"\".\n" +
    "USER CONTENT:\n<<<\n" + text + "\n>>>";
  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });
    const raw = (msg.content || []).map((b) => b.text || "").join("");
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const v = JSON.parse(m[0]);
    return { allow: !!v.allow, categories: v.categories || [], reason: v.reason || "" };
  } catch (e) {
    return null;
  }
}

// returns {status:'ok'|'blocked'|'unverified', categories, reason, unverified?}
async function moderateText(text) {
  if (!text || !text.trim()) return { status: "ok", categories: [], reason: "" };
  const local = localScan(text);
  if (local) return { status: "blocked", categories: local.categories, reason: local.reason };
  const ai = await aiClassify(text);
  if (!ai) return { status: "ok", categories: [], reason: "", unverified: true };
  if (ai.allow) return { status: "ok", categories: [], reason: "" };
  return { status: "blocked", categories: ai.categories, reason: ai.reason || "This doesn't meet our community guidelines." };
}

module.exports = { NU_GUIDELINES, moderateText, localScan };
