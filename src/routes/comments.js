const express = require("express");
const router = express.Router();

const {
  getComments,
  addComment,
  deleteComment,
} = require("../controllers/commentController");

const { authenticate } = require("../middleware/auth");

// GET /api/comments/:reportId
router.get("/:reportId", authenticate, getComments);

// POST /api/comments
router.post("/", authenticate, addComment);

// DELETE /api/comments/:id
router.delete("/:id", authenticate, deleteComment);

module.exports = router;
