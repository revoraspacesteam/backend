const express = require("express");
const multer = require("multer");
const { createEnquiry } = require("../controllers/enquiryController");

const router = express.Router();
const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 3,
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      return callback(new Error("Only JPG, PNG, WebP, and PDF files are allowed."));
    }

    return callback(null, true);
  },
});

router.post("/", upload.array("files", 3), createEnquiry);

module.exports = router;
