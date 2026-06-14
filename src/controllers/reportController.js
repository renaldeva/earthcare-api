const { randomBytes } = require("crypto");
const supabase = require("../lib/supabase");

// Kategori masalah yang valid
const VALID_CATEGORIES = [
  "sampah_liar",
  "sungai_tercemar",
  "pohon_tumbang",
  "banjir",
  "polusi_udara",
  "kerusakan_fasilitas",
  "lainnya",
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

  // Kirim notifikasi konfirmasi ke pembuat laporan
  await supabase.from("notifications").insert({
    user_id: req.user.id,
    report_id: report.id,
    type: "report_created",
    title: "Laporan Berhasil Dibuat!",
    body: `Laporan "${title}" telah kami terima dan akan segera diverifikasi oleh petugas.`,
    is_read: false,
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
      `id, report_code, title, description, category, status,
      latitude, longitude, address, photo_url, assigned_officer_id,
      created_at, updated_at,
      users!reports_user_id_fkey(id, name, phone, avatar_url),
      report_comments(count)`,
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

// ── GET /api/reports/me ─────────────────────────────────
async function getMyReports(req, res) {
  const { page = 1, limit = 10, category, status } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = supabase
    .from("reports")
    .select(
      `id, report_code, title, category, status,
      latitude, longitude, address, photo_url, assigned_officer_id,
      created_at, updated_at,
      users!reports_user_id_fkey(id, name, avatar_url),
      report_comments(count)`,
      { count: "exact" }
    )
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + parseInt(limit) - 1);

  if (category) query = query.eq("category", category);
  if (status) query = query.eq("status", status);

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

  // Cek apakah laporan ada dan milik user
  const { data: report, error: fetchError } = await supabase
    .from("reports")
    .select("id, status, user_id")
    .eq("id", id)
    .single();

  if (fetchError || !report) {
    return res
      .status(404)
      .json({ success: false, message: "Laporan tidak ditemukan" });
  }

  if (report.user_id !== req.user.id && req.user.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Akses ditolak" });
  }

  if (req.user.role !== "admin" && report.status !== "received") {
    return res.status(400).json({
      success: false,
      message: "Laporan tidak bisa dibatalkan karena sudah diproses",
    });
  }

  // Hapus notifikasi terkait laporan ini (agar tidak error FK jika cascade off)
  await supabase.from("notifications").delete().eq("report_id", id);

  // Hapus riwayat status
  await supabase.from("report_status_history").delete().eq("report_id", id);

  // Hapus laporan
  const { error: deleteError } = await supabase
    .from("reports")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error(deleteError);
    return res
      .status(500)
      .json({ success: false, message: "Gagal membatalkan laporan" });
  }

  return res.json({ success: true, message: "Laporan berhasil dibatalkan" });
}

module.exports = {
  createReport,
  getReports,
  getReportById,
  getHeatmap,
  deleteReport,
  getMyReports,
};