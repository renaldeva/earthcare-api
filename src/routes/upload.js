const express = require("express");
const router = express.Router();
const { getSignedUploadUrl, deletePhoto } = require("../controllers/uploadController");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

// POST /api/upload/signed-url
router.post("/signed-url", getSignedUploadUrl);

// DELETE /api/upload
router.delete("/", deletePhoto);

module.exports = router;