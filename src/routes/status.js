const express = require("express");
const router = express.Router();
const {
  updateStatus,
  getStatusHistory,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../controllers/statusController");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate);

// PATCH /api/status/:reportId  — hanya officer & admin
router.patch("/:reportId", authorize("officer", "admin"), updateStatus);

// GET /api/status/:reportId/history
router.get("/:reportId/history", getStatusHistory);

// GET /api/status/notifications
router.get("/notifications", getNotifications);

// PATCH /api/status/notifications/read-all
router.patch("/notifications/read-all", markAllNotificationsRead);

// PATCH /api/status/notifications/:id/read
router.patch("/notifications/:id/read", markNotificationRead);

module.exports = router;