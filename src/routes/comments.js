const express = require("express");
const router = express.Router();

const {
  getComments,
  addComment,
  deleteComment,
} = require("../controllers/commentController");

const { requireAuth } = require("../middlewares/authMiddleware");

// GET /api/comments/:reportId
router.get("/:reportId", requireAuth, getComments);

// POST /api/comments
router.post("/", requireAuth, addComment);

// DELETE /api/comments/:id
router.delete("/:id", requireAuth, deleteComment);

module.exports = router;
