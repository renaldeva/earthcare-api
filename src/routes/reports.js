const express = require("express");
const router = express.Router();
const {
  createReport,
  getReports,
  getReportById,
  getHeatmap,
  deleteReport,
} = require("../controllers/reportController");
const { authenticate, authorize } = require("../middleware/auth");

// Semua route butuh token
router.use(authenticate);

// GET /api/reports/heatmap  — harus sebelum /:id agar tidak ditangkap sebagai ID
router.get("/heatmap", getHeatmap);

// GET  /api/reports
router.get("/", getReports);

// POST /api/reports
router.post("/", createReport);

// GET  /api/reports/:id
router.get("/:id", getReportById);

// DELETE /api/reports/:id
router.delete("/:id", deleteReport);

module.exports = router;