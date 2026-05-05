const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const extensionsByMime = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "image/gif": ".gif",
    };
    const safeExt = extensionsByMime[file.mimetype] || "";
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${safeExt}`;

    cb(null, uniqueName);
  },
});

const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const fileFilter = (_req, file, cb) => {
  if (!allowedTypes.has(file.mimetype)) {
    return cb(new Error("Only image uploads are allowed"));
  }

  cb(null, true);
};

const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

module.exports = { uploadAvatar };
