const express = require("express");
const fs = require("fs");
const crypto = require("crypto");
const db = require("../db");
const { requireAuth, requireAdmin } = require("../auth");
const { moderateText } = require("../lib/moderation");
const { moderateImageBuffer } = require("../lib/image-moderation");
const { upload, fileUrl } = require("../lib/uploads");
const { sendAdInquiryEmail, sendCreativeFormEmail } = require("../lib/mailer");

const router = express.Router();

function safeUrl(url) {
  const u = String(url || "").trim();
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  return "https://" + u;
}

const NU_AD_SLOTS = [
  { id: "home-1", label: "Home sidebar — slot 1", note: "Homepage sidebar, position 1" },
  { id: "home-2", label: "Home sidebar — slot 2", note: "Homepage sidebar, position 2" },
  { id: "home-3", label: "Home sidebar — slot 3", note: "Homepage sidebar, position 3" },
  { id: "home-4", label: "Home sidebar — slot 4", note: "Homepage sidebar, position 4" },
  { id: "home-5", label: "Home sidebar — slot 5", note: "Homepage sidebar, position 5" },
  { id: "home-6", label: "Home sidebar — slot 6", note: "Homepage sidebar, position 6" },
  { id: "home-7", label: "Home sidebar — slot 7", note: "Homepage sidebar, position 7" },
  { id: "home-8", label: "Home sidebar — slot 8", note: "Homepage sidebar, position 8" },
];
const NU_AD_FORMATS = ["photo", "video", "audio", "text", "link"];

router.get("/slots", (req, res) => res.json({ slots: NU_AD_SLOTS, formats: NU_AD_FORMATS }));

function serializeAd(row) {
  return {
    id: row.id, company: row.company, format: row.format, headline: row.headline,
    body: row.body, url: row.url, cta: row.cta, mediaSrc: row.media_src,
    slot: row.slot, live: !!row.live, createdAt: row.created_at,
  };
}
function serializeReq(row) {
  return {
    id: row.id, company: row.company, contact: row.contact, format: row.format,
    headline: row.headline, body: row.body, url: row.url, cta: row.cta, mediaSrc: row.media_src,
    preferredSlot: row.preferred_slot, note: row.note, status: row.status, createdAt: row.created_at,
  };
}

// GET /api/ads/live/:slotId — public: the ad currently running in a slot (or none)
router.get("/live/:slotId", (req, res) => {
  const row = db.prepare("SELECT * FROM ads WHERE slot = ? AND live = 1 ORDER BY created_at DESC LIMIT 1").get(req.params.slotId);
  res.json({ ad: row ? serializeAd(row) : null });
});

// POST /api/ads/media — upload + moderate (image only) for ad creative
router.post("/media", requireAuth, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });
  const isImage = /^image\//.test(req.file.mimetype);
  if (isImage) {
    const buffer = fs.readFileSync(req.file.path);
    const result = await moderateImageBuffer(buffer, req.file.originalname, { maxDim: 900 });
    if (result.status === "blocked") {
      fs.unlink(req.file.path, () => {});
      return res.status(422).json({ error: result.reason });
    }
  }
  res.json({ url: fileUrl(req.file.filename) });
});

// POST /api/ads/media/public — upload for token-based creative form (no auth required)
router.post("/media/public", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });
  // Verify the token belongs to an approved request before allowing upload
  const token = String(req.body.token || req.query.token || "");
  if (!token) { fs.unlink(req.file.path, () => {}); return res.status(401).json({ error: "Invalid token." }); }
  const r = db.prepare("SELECT id FROM ad_requests WHERE token = ? AND status = 'approved'").get(token);
  if (!r) { fs.unlink(req.file.path, () => {}); return res.status(401).json({ error: "Invalid or expired token." }); }

  const isImage = /^image\//.test(req.file.mimetype);
  if (isImage) {
    const buffer = fs.readFileSync(req.file.path);
    const result = await moderateImageBuffer(buffer, req.file.originalname, { maxDim: 900 });
    if (result.status === "blocked") {
      fs.unlink(req.file.path, () => {});
      return res.status(422).json({ error: result.reason });
    }
  }
  res.json({ url: fileUrl(req.file.filename) });
});

// ---------- Company inquiry submission ----------
router.post("/requests", async (req, res) => {
  const d = req.body || {};
  const company = String(d.company || "").trim();
  const contact = String(d.contact || "").trim();
  const headline = String(d.headline || "").trim();
  const format = NU_AD_FORMATS.includes(d.format) ? d.format : "photo";
  if (!company || !contact || !headline) return res.status(400).json({ error: "Company, contact, and headline are required." });

  const text = [company, headline, d.body, d.note].filter(Boolean).join("\n");
  const check = await moderateText(text);
  if (check.status === "blocked") return res.status(422).json({ error: check.reason });

  const id = "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const ts = Date.now();
  db.prepare(`
    INSERT INTO ad_requests (id, company, contact, format, headline, body, url, cta, media_src, preferred_slot, note, status, created_at)
    VALUES (@id, @company, @contact, @format, @headline, @body, @url, @cta, @media_src, @preferred_slot, @note, 'pending', @created_at)
  `).run({
    id, company, contact, format, headline,
    body: String(d.body || "").trim(), url: safeUrl(d.url),
    cta: String(d.cta || "").trim() || "Learn more",
    media_src: d.mediaSrc || null,
    preferred_slot: NU_AD_SLOTS.some((s) => s.id === d.preferredSlot) ? d.preferredSlot : "home-1",
    note: String(d.note || "").trim(),
    created_at: ts,
  });
  const row = db.prepare("SELECT * FROM ad_requests WHERE id = ?").get(id);
  res.status(201).json({ request: serializeReq(row) });

  sendAdInquiryEmail({
    company, contact,
    what: String(d.body || headline).trim(),
    timing: String(d.note || "").trim(),
  }).catch((err) => console.error("Ad inquiry email failed:", err.message));
});

// ---------- Token-based creative submission (public — company fills out their ad) ----------

// GET /api/ads/creative/:token — get the approved request so the form can greet the company
router.get("/creative/:token", (req, res) => {
  const r = db.prepare("SELECT * FROM ad_requests WHERE token = ?").get(req.params.token);
  if (!r) return res.status(404).json({ error: "This link is invalid or has already been used." });
  if (r.status === "creative_submitted" || r.status === "placed") {
    return res.json({ alreadySubmitted: true, company: r.company });
  }
  if (r.status !== "approved") return res.status(410).json({ error: "This link is no longer active." });
  res.json({ company: r.company, formats: NU_AD_FORMATS });
});

// POST /api/ads/creative/:token — company submits their creative
router.post("/creative/:token", upload.single("file"), async (req, res) => {
  const r = db.prepare("SELECT * FROM ad_requests WHERE token = ?").get(req.params.token);
  if (!r || r.status !== "approved") return res.status(410).json({ error: "This link is invalid or has already been used." });

  const d = req.body || {};
  const headline = String(d.headline || "").trim();
  const format = NU_AD_FORMATS.includes(d.format) ? d.format : "text";
  if (!headline) return res.status(400).json({ error: "A headline is required." });

  const text = [headline, d.body].filter(Boolean).join("\n");
  const check = await moderateText(text);
  if (check.status === "blocked") {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(422).json({ error: check.reason });
  }

  let mediaSrc = d.mediaSrc || null;
  if (req.file) {
    const isImage = /^image\//.test(req.file.mimetype);
    if (isImage) {
      const buffer = fs.readFileSync(req.file.path);
      const result = await moderateImageBuffer(buffer, req.file.originalname, { maxDim: 900 });
      if (result.status === "blocked") {
        fs.unlink(req.file.path, () => {});
        return res.status(422).json({ error: result.reason });
      }
    }
    mediaSrc = fileUrl(req.file.filename);
  }

  db.prepare(`
    UPDATE ad_requests SET
      format = ?, headline = ?, body = ?, url = ?, cta = ?, media_src = ?, status = 'creative_submitted'
    WHERE token = ?
  `).run(
    format,
    headline,
    String(d.body || "").trim(),
    safeUrl(d.url),
    String(d.cta || "").trim() || "Learn more",
    mediaSrc,
    req.params.token,
  );

  res.json({ ok: true });
});

// ---------- Admin console (requires is_admin) ----------

router.get("/requests", requireAdmin, (req, res) => {
  const rows = db.prepare("SELECT * FROM ad_requests ORDER BY created_at DESC").all();
  res.json({ requests: rows.map(serializeReq) });
});

// POST /requests/:id/approve — generate token, email company the creative form link
router.post("/requests/:id/approve", requireAdmin, async (req, res) => {
  const r = db.prepare("SELECT * FROM ad_requests WHERE id = ?").get(req.params.id);
  if (!r) return res.status(404).json({ error: "Request not found." });
  if (r.status !== "pending") return res.status(400).json({ error: "Request is not pending." });

  const token = crypto.randomBytes(24).toString("hex");
  db.prepare("UPDATE ad_requests SET status = 'approved', token = ? WHERE id = ?").run(token, r.id);

  res.json({ ok: true });

  sendCreativeFormEmail({ company: r.company, contact: r.contact, token })
    .catch((err) => console.error("Creative form email failed:", err.message));
});

// POST /requests/:id/reject
router.post("/requests/:id/reject", requireAdmin, (req, res) => {
  const r = db.prepare("SELECT * FROM ad_requests WHERE id = ?").get(req.params.id);
  if (!r) return res.status(404).json({ error: "Request not found." });
  db.prepare("UPDATE ad_requests SET status = 'rejected' WHERE id = ?").run(r.id);
  res.json({ ok: true });
});

// POST /requests/:id/place — admin places a submitted creative live in a slot
router.post("/requests/:id/place", requireAdmin, (req, res) => {
  const r = db.prepare("SELECT * FROM ad_requests WHERE id = ?").get(req.params.id);
  if (!r) return res.status(404).json({ error: "Request not found." });
  if (!["creative_submitted", "approved"].includes(r.status)) {
    return res.status(400).json({ error: "No creative to place yet." });
  }
  if (!r.headline) return res.status(400).json({ error: "Creative is missing a headline." });

  const slot = NU_AD_SLOTS.some((s) => s.id === req.body.slot) ? req.body.slot
    : (NU_AD_SLOTS.some((s) => s.id === r.preferred_slot) ? r.preferred_slot : NU_AD_SLOTS[0].id);
  const live = req.body.live !== false;
  const id = "a" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  if (live) db.prepare("UPDATE ads SET live = 0 WHERE slot = ?").run(slot);
  db.prepare(`
    INSERT INTO ads (id, company, format, headline, body, url, cta, media_src, slot, live, created_at)
    VALUES (@id, @company, @format, @headline, @body, @url, @cta, @media_src, @slot, @live, @created_at)
  `).run({
    id, company: r.company, format: r.format, headline: r.headline,
    body: r.body, url: safeUrl(r.url), cta: r.cta, media_src: r.media_src,
    slot, live: live ? 1 : 0, created_at: Date.now(),
  });
  db.prepare("UPDATE ad_requests SET status = 'placed' WHERE id = ?").run(r.id);
  res.json({ ok: true, ad: serializeAd(db.prepare("SELECT * FROM ads WHERE id = ?").get(id)) });
});

router.get("/", requireAdmin, (req, res) => {
  const rows = db.prepare("SELECT * FROM ads ORDER BY created_at DESC").all();
  res.json({ ads: rows.map(serializeAd) });
});

router.post("/", requireAdmin, (req, res) => {
  const d = req.body || {};
  const company = String(d.company || "").trim();
  const headline = String(d.headline || "").trim();
  const format = NU_AD_FORMATS.includes(d.format) ? d.format : "photo";
  if (!company || !headline) return res.status(400).json({ error: "Advertiser name and headline are required." });
  const slot = NU_AD_SLOTS.some((s) => s.id === d.slot) ? d.slot : NU_AD_SLOTS[0].id;
  const live = d.live ? 1 : 0;
  const id = "a" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  if (live) db.prepare("UPDATE ads SET live = 0 WHERE slot = ?").run(slot);
  db.prepare(`
    INSERT INTO ads (id, company, format, headline, body, url, cta, media_src, slot, live, created_at)
    VALUES (@id, @company, @format, @headline, @body, @url, @cta, @media_src, @slot, @live, @created_at)
  `).run({ id, company, format, headline, body: String(d.body || "").trim(), url: safeUrl(d.url), cta: String(d.cta || "").trim() || "Learn more", media_src: d.mediaSrc || null, slot, live, created_at: Date.now() });
  res.status(201).json({ ad: serializeAd(db.prepare("SELECT * FROM ads WHERE id = ?").get(id)) });
});

// PATCH /api/ads/:id  — { slot?, live? }
router.patch("/:id", requireAdmin, (req, res) => {
  const ad = db.prepare("SELECT * FROM ads WHERE id = ?").get(req.params.id);
  if (!ad) return res.status(404).json({ error: "Ad not found." });
  const { slot, live } = req.body || {};
  const nextSlot = slot != null && NU_AD_SLOTS.some((s) => s.id === slot) ? slot : ad.slot;
  const nextLive = live != null ? (live ? 1 : 0) : ad.live;
  if (nextLive) db.prepare("UPDATE ads SET live = 0 WHERE slot = ? AND id != ?").run(nextSlot, ad.id);
  db.prepare("UPDATE ads SET slot = ?, live = ? WHERE id = ?").run(nextSlot, nextLive, ad.id);
  res.json({ ad: serializeAd(db.prepare("SELECT * FROM ads WHERE id = ?").get(ad.id)) });
});

router.post("/slots/:slotId/clear", requireAdmin, (req, res) => {
  db.prepare("UPDATE ads SET live = 0 WHERE slot = ?").run(req.params.slotId);
  res.json({ ok: true });
});

router.delete("/:id", requireAdmin, (req, res) => {
  db.prepare("DELETE FROM ads WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
