const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || "").slice(0, 8).replace(/[^a-zA-Z0-9.]/g, "");
    cb(null, crypto.randomBytes(16).toString("hex") + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^(image|video|audio)\//.test(file.mimetype)) cb(null, true);
    else cb(new Error("Unsupported file type"));
  },
});

function fileUrl(filename) {
  return "/uploads/" + filename;
}

module.exports = { upload, fileUrl, UPLOAD_DIR };
