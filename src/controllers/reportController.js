const { randomBytes } = require("crypto");
const supabase = require("../lib/supabase");

// Kategori masalah yang valid
const VALID_CATEGORIES = [
  "Sampah Liar",
  "Sungai Tercemar",
  "Pohon Tumbang",
  "Banjir",
  "Polusi Udara",
  "Kerusakan Fasilitas",
  "Lainnya",
];

// Generate report code tanpa uuid
function generateReportCode() {
  const suffix = randomBytes(3).toString("hex").toUpperCase(); // 6 karakter
  return `EC-${Date.now()}-${suffix}`;
}

// ── POST /api/reports ───────────────────────────────────
async function createReport(req, res) {
  const {
    title,
    description,
    category,
    latitude,
    longitude,
    address,
    photo_url,
    photo_metadata,
  } = req.body;

  if (!title || !category || !latitude || !longitude || !photo_url) {
    return res.status(400).json({
      success: false,
      message: "title, category, latitude, longitude, dan photo_url wajib diisi",
    });
  }

  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({
      success: false,
      message: `Kategori tidak valid. Pilihan: ${VALID_CATEGORIES.join(", ")}`,
    });
  }

  const report_code = generateReportCode();

  const { data: report, error } = await supabase
    .from("reports")
    .insert({
      report_code,
      user_id: req.user.id,
      title,
      description,
      category,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address,
      photo_url,
      photo_metadata: photo_metadata || null,
      status: "received",
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal membuat laporan" });
  }

  await supabase.from("report_status_history").insert({
    report_id: report.id,
    status: "received",
    changed_by: req.user.id,
    note: "Laporan diterima oleh sistem",
  });

  return res.status(201).json({
    success: true,
    message: "Laporan berhasil dibuat",
    data: report,
  });
}

// ── GET /api/reports ────────────────────────────────────
async function getReports(req, res) {
  const {
    page = 1,
    limit = 10,
    category,
    status,
    user_id,
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = supabase
    .from("reports")
    .select(
      `id, report_code, title, category, status,
      latitude, longitude, address, photo_url,
      created_at, updated_at,
      users!reports_user_id_fkey(id, name, avatar_url)`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + parseInt(limit) - 1);

  if (category) query = query.eq("category", category);
  if (status) query = query.eq("status", status);

  if (user_id) {
    query = query.eq("user_id", user_id);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal mengambil laporan" });
  }

  return res.json({
    success: true,
    data,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      total_pages: Math.ceil(count / parseInt(limit)),
    },
  });
}

// ── GET /api/reports/:id ────────────────────────────────
async function getReportById(req, res) {
  const { id } = req.params;

  const { data: report, error } = await supabase
    .from("reports")
    .select(
      `*,
      users!reports_user_id_fkey(id, name, email, avatar_url),
      report_status_history(
        id, status, note, photo_url, created_at,
        users(id, name, role)
      )`
    )
    .eq("id", id)
    .single();

  if (error || !report) {
    return res
      .status(404)
      .json({ success: false, message: "Laporan tidak ditemukan" });
  }

  return res.json({ success: true, data: report });
}

// ── GET /api/reports/heatmap ────────────────────────────
async function getHeatmap(req, res) {
  const { category, status, days = 30 } = req.query;

  const since = new Date();
  since.setDate(since.getDate() - parseInt(days));

  let query = supabase
    .from("reports")
    .select("id, category, status, latitude, longitude, created_at")
    .gte("created_at", since.toISOString());

  if (category) query = query.eq("category", category);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal mengambil data heatmap" });
  }

  return res.json({
    success: true,
    data,
    meta: { total: data.length, days: parseInt(days) },
  });
}

// ── DELETE /api/reports/:id ─────────────────────────────
async function deleteReport(req, res) {
  const { id } = req.params;

  const { data: report } = await supabase
    .from("reports")
    .select("id, user_id")
    .eq("id", id)
    .single();

  if (!report) {
    return res
      .status(404)
      .json({ success: false, message: "Laporan tidak ditemukan" });
  }

  if (req.user.role !== "admin" && report.user_id !== req.user.id) {
    return res.status(403).json({ success: false, message: "Akses ditolak" });
  }

  const { error } = await supabase.from("reports").delete().eq("id", id);

  if (error) {
    return res
      .status(500)
      .json({ success: false, message: "Gagal menghapus laporan" });
  }

  return res.json({ success: true, message: "Laporan berhasil dihapus" });
}

module.exports = {
  createReport,
  getReports,
  getReportById,
  getHeatmap,
  deleteReport,
};