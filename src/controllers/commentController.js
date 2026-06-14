const supabase = require("../lib/supabase");

// ── GET /api/comments/:reportId ────────────────────────────────────
async function getComments(req, res) {
  const { reportId } = req.params;

  const { data, error } = await supabase
    .from("report_comments")
    .select(
      `
      id, content, created_at,
      user:users(id, name, avatar_url, role)
      `
    )
    .eq("report_id", reportId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal mengambil komentar" });
  }

  return res.json({ success: true, data });
}

// ── POST /api/comments ───────────────────────────────────
async function addComment(req, res) {
  const { report_id, content } = req.body;

  if (!report_id || !content) {
    return res.status(400).json({
      success: false,
      message: "report_id dan content wajib diisi",
    });
  }

  const { data: comment, error } = await supabase
    .from("report_comments")
    .insert({
      report_id,
      user_id: req.user.id,
      content,
    })
    .select(
      `
      id, content, created_at,
      user:users(id, name, avatar_url, role)
      `
    )
    .single();

  if (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal menambahkan komentar" });
  }

  return res.status(201).json({
    success: true,
    message: "Komentar berhasil ditambahkan",
    data: comment,
  });
}

// ── DELETE /api/comments/:id ───────────────────────────────────
async function deleteComment(req, res) {
  const { id } = req.params;

  // Cek kepemilikan
  const { data: comment, error: fetchError } = await supabase
    .from("report_comments")
    .select("user_id")
    .eq("id", id)
    .single();

  if (fetchError || !comment) {
    return res
      .status(404)
      .json({ success: false, message: "Komentar tidak ditemukan" });
  }

  if (comment.user_id !== req.user.id && req.user.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Akses ditolak" });
  }

  const { error: deleteError } = await supabase
    .from("report_comments")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error(deleteError);
    return res
      .status(500)
      .json({ success: false, message: "Gagal menghapus komentar" });
  }

  return res.json({ success: true, message: "Komentar berhasil dihapus" });
}

module.exports = {
  getComments,
  addComment,
  deleteComment,
};
