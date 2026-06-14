const supabase = require("../lib/supabase");

// Urutan status yang valid dan arahnya
const STATUS_FLOW = [
  "received",     // Diterima
  "verified",     // Diverifikasi
  "assigned",     // Ditugaskan
  "in_progress",  // Dalam Penanganan
  "resolved",     // Selesai
];

const STATUS_LABELS = {
  received: "Diterima",
  verified: "Diverifikasi",
  assigned: "Ditugaskan",
  in_progress: "Dalam Penanganan",
  resolved: "Selesai",
};

// ── PATCH /api/status/:reportId ─────────────────────────
// Update status laporan (hanya officer / admin)
async function updateStatus(req, res) {
  const { reportId } = req.params;
  const { status, note, photo_url, assigned_officer_ids } = req.body;

  if (!status) {
    return res
      .status(400)
      .json({ success: false, message: "status wajib diisi" });
  }

  if (!STATUS_FLOW.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Status tidak valid. Pilihan: ${STATUS_FLOW.join(", ")}`,
    });
  }

  // Ambil laporan sekarang
  const { data: report, error: fetchError } = await supabase
    .from("reports")
    .select("id, status, user_id")
    .eq("id", reportId)
    .single();

  if (fetchError || !report) {
    return res
      .status(404)
      .json({ success: false, message: "Laporan tidak ditemukan" });
  }

  // Validasi urutan status (tidak boleh mundur)
  const currentIdx = STATUS_FLOW.indexOf(report.status);
  const newIdx = STATUS_FLOW.indexOf(status);

  if (newIdx < currentIdx) {
    return res.status(400).json({
      success: false,
      message: `Status tidak bisa dikembalikan dari "${STATUS_LABELS[report.status]}" ke "${STATUS_LABELS[status]}"`,
    });
  }

  // Update tabel reports
  const updatePayload = { status, updated_at: new Date().toISOString() };
  // We no longer use assigned_officer_id in reports table
  // if (assigned_officer_ids && assigned_officer_ids.length > 0) {
  //   updatePayload.assigned_officer_id = assigned_officer_ids[0]; // fallback legacy
  // }

  const { data: updated, error: updateError } = await supabase
    .from("reports")
    .update(updatePayload)
    .eq("id", reportId)
    .select()
    .single();

  if (updateError) {
    console.error(updateError);
    return res
      .status(500)
      .json({ success: false, message: "Gagal memperbarui status" });
  }

  // Handle multiple assignees
  if (assigned_officer_ids && Array.isArray(assigned_officer_ids) && assigned_officer_ids.length > 0) {
    // 1. Delete existing assignees for this report
    await supabase.from("report_assignees").delete().eq("report_id", reportId);

    // 2. Insert new assignees
    const assigneePayload = assigned_officer_ids.map(officerId => ({
      report_id: reportId,
      officer_id: officerId
    }));
    const { error: assignError } = await supabase.from("report_assignees").insert(assigneePayload);
    
    if (assignError) {
      console.error("Gagal insert report_assignees:", assignError);
    }
  }

  // Catat ke riwayat status
  await supabase.from("report_status_history").insert({
    report_id: reportId,
    status,
    changed_by: req.user.id,
    note: note || `Status diperbarui ke "${STATUS_LABELS[status]}"`,
    photo_url: photo_url || null,
  });

  // Kirim notifikasi ke pemilik laporan
  await supabase.from("notifications").insert({
    user_id: report.user_id,
    report_id: reportId,
    type: "status_update",
    title: `Laporan kamu diperbarui`,
    body: `Status laporan kamu sekarang: ${STATUS_LABELS[status]}`,
    is_read: false,
  });

  return res.json({
    success: true,
    message: `Status berhasil diperbarui ke "${STATUS_LABELS[status]}"`,
    data: updated,
  });
}

// ── GET /api/status/:reportId/history ───────────────────
// Riwayat perubahan status laporan
async function getStatusHistory(req, res) {
  const { reportId } = req.params;

  const { data, error } = await supabase
    .from("report_status_history")
    .select(
      `
      id, status, note, photo_url, created_at,
      users(id, name, role)
    `
    )
    .eq("report_id", reportId)
    .order("created_at", { ascending: true });

  if (error) {
    return res
      .status(500)
      .json({ success: false, message: "Gagal mengambil riwayat status" });
  }

  return res.json({ success: true, data });
}

// ── GET /api/status/notifications ───────────────────────
// Notifikasi milik user yang login
async function getNotifications(req, res) {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, is_read, created_at, report_id")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return res
      .status(500)
      .json({ success: false, message: "Gagal mengambil notifikasi" });
  }

  return res.json({ success: true, data });
}

// ── PATCH /api/status/notifications/:id/read ────────────
// Tandai notifikasi sebagai sudah dibaca
async function markNotificationRead(req, res) {
  const { id } = req.params;

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", req.user.id); // pastikan miliknya sendiri

  if (error) {
    return res
      .status(500)
      .json({ success: false, message: "Gagal memperbarui notifikasi" });
  }

  return res.json({ success: true, message: "Notifikasi ditandai sudah dibaca" });
}

// ── PATCH /api/status/notifications/read-all ────────────
// Tandai semua notifikasi sebagai sudah dibaca
async function markAllNotificationsRead(req, res) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", req.user.id)
    .eq("is_read", false);

  if (error) {
    return res
      .status(500)
      .json({ success: false, message: "Gagal memperbarui notifikasi" });
  }

  return res.json({ success: true, message: "Semua notifikasi ditandai sudah dibaca" });
}

module.exports = {
  updateStatus,
  getStatusHistory,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};