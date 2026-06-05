const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Verifikasi token JWT dari header Authorization.
 * Menambahkan req.user = { id, email, role } jika valid.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "Token tidak ditemukan" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Token tidak valid atau sudah expired" });
  }
}

/**
 * Middleware role guard — pakai setelah authenticate().
 * Contoh: authorize("officer", "admin")
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak: role tidak memiliki izin",
      });
    }
    next();
  };
}

module.exports = { authenticate, authorize };