const { randomBytes } = require("crypto");
const supabase = require("../lib/supabase");

const BUCKET = "earthcare-photos";

// ── POST /api/upload/signed-url ─────────────────────────
async function getSignedUploadUrl(req, res) {
  const { filename, content_type } = req.body;

  if (!filename || !content_type) {
    return res.status(400).json({
      success: false,
      message: "filename dan content_type wajib diisi",
    });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(content_type)) {
    return res.status(400).json({
      success: false,
      message: "Hanya file JPEG, PNG, atau WebP yang diizinkan",
    });
  }

  // Generate unique path tanpa uuid
  const ext = filename.split(".").pop().toLowerCase();
  const uniqueId = randomBytes(8).toString("hex");
  const storagePath = `photos/${req.user.id}/${uniqueId}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(storagePath);

  if (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal membuat signed URL" });
  }

  const { data: publicData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  return res.json({
    success: true,
    data: {
      signed_url: data.signedUrl,
      token: data.token,
      path: storagePath,
      public_url: publicData.publicUrl,
    },
  });
}

// ── DELETE /api/upload ──────────────────────────────────
async function deletePhoto(req, res) {
  const { path } = req.body;

  if (!path) {
    return res
      .status(400)
      .json({ success: false, message: "path wajib diisi" });
  }

  if (!path.includes(`/${req.user.id}/`) && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Akses ditolak" });
  }

  const { error } = await supabase.storage.from(BUCKET).remove([path]);

  if (error) {
    return res
      .status(500)
      .json({ success: false, message: "Gagal menghapus foto" });
  }

  return res.json({ success: true, message: "Foto berhasil dihapus" });
}

module.exports = { getSignedUploadUrl, deletePhoto };