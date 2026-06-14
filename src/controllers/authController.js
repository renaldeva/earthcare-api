const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomInt } = require("crypto");
const supabase = require("../lib/supabase");
const { sendOtpEmail } = require("../lib/mailer");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";
const OTP_EXPIRY_MINUTES = 5;

/* =========================
   UTIL
========================= */

function generateOtp() {
  return String(randomInt(100000, 999999));
}

function generateJwt(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );
}

/* =========================
   REGISTER - SEND OTP
   POST /api/auth/register
========================= */

async function register(req, res) {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "name, email, dan password wajib diisi",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password minimal 6 karakter",
      });
    }

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email sudah terdaftar",
      });
    }

    await supabase
      .from("otp_verifications")
      .delete()
      .eq("email", email)
      .eq("purpose", "register");

    const otp = generateOtp();

    const otp_hash = await bcrypt.hash(otp, 10);

    const password_hash = await bcrypt.hash(password, 12);

    const expires_at = new Date(
      Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
    ).toISOString();

    const temp_data = JSON.stringify({
      name,
      phone,
      password_hash,
      role: "citizen",
    });

    const { error } = await supabase
      .from("otp_verifications")
      .insert({
        email,
        otp_hash,
        temp_data,
        expires_at,
        purpose: "register",
      });

    if (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Gagal membuat OTP",
      });
    }

    await sendOtpEmail(email, otp, name);

    return res.json({
      success: true,
      message: `OTP berhasil dikirim ke ${email}`,
      data: {
        email,
        expires_in_minutes: OTP_EXPIRY_MINUTES,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
}

/* =========================
   VERIFY REGISTER
   POST /api/auth/register/verify
========================= */

async function verifyRegister(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "email dan otp wajib diisi",
      });
    }

    const { data: record, error } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("email", email)
      .eq("purpose", "register")
      .single();

    if (error || !record) {
      return res.status(400).json({
        success: false,
        message: "OTP tidak ditemukan",
      });
    }

    if (new Date() > new Date(record.expires_at)) {
      await supabase
        .from("otp_verifications")
        .delete()
        .eq("email", email)
        .eq("purpose", "register");

      return res.status(400).json({
        success: false,
        message: "OTP sudah kadaluarsa",
      });
    }

    const isValid = await bcrypt.compare(
      String(otp),
      record.otp_hash
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "OTP salah",
      });
    }

    const temp = JSON.parse(record.temp_data);

    const { data: user, error: createError } = await supabase
      .from("users")
      .insert({
        name: temp.name,
        email,
        phone: temp.phone,
        password_hash: temp.password_hash,
        role: temp.role,
      })
      .select(
        "id, name, email, phone, role, avatar_url, created_at"
      )
      .single();

    if (createError) {
      console.error(createError);

      return res.status(500).json({
        success: false,
        message: "Gagal membuat akun",
      });
    }

    await supabase
      .from("otp_verifications")
      .delete()
      .eq("email", email)
      .eq("purpose", "register");

    const token = generateJwt(user);

    return res.status(201).json({
      success: true,
      message: "Registrasi berhasil",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
}

/* =========================
   RESEND REGISTER OTP
   POST /api/auth/register/resend-otp
========================= */

async function resendRegisterOtp(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "email wajib diisi",
      });
    }

    const { data: record } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("email", email)
      .eq("purpose", "register")
      .single();

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Session registrasi tidak ditemukan",
      });
    }

    const createdAt = new Date(record.created_at);

    const diff =
      (Date.now() - createdAt.getTime()) / 1000;

    if (diff < 60) {
      return res.status(429).json({
        success: false,
        message: `Tunggu ${Math.ceil(
          60 - diff
        )} detik sebelum meminta OTP baru`,
      });
    }

    const otp = generateOtp();

    const otp_hash = await bcrypt.hash(otp, 10);

    const expires_at = new Date(
      Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
    ).toISOString();

    await supabase
      .from("otp_verifications")
      .update({
        otp_hash,
        expires_at,
      })
      .eq("email", email)
      .eq("purpose", "register");

    await sendOtpEmail(email, otp, "User");

    return res.json({
      success: true,
      message: "OTP baru berhasil dikirim",
      data: {
        email,
        expires_in_minutes: OTP_EXPIRY_MINUTES,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
}

/* =========================
   LOGIN
========================= */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "email dan password wajib diisi",
      });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah",
      });
    }

    const token = generateJwt(user);

    return res.json({
      success: true,
      message: "Login berhasil",
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar_url: user.avatar_url,
        },
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
}
/* =========================
   ME
========================= */
async function me(req, res) {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select(
        "id, name, email, phone, role, avatar_url, created_at"
      )
      .eq("id", req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data user",
    });
  }
}

/* =========================
   FORGOT PASSWORD
========================= */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "email wajib diisi",
      });
    }

    const { data: user } = await supabase
      .from("users")
      .select("id,name,email")
      .eq("email", email)
      .single();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email tidak ditemukan",
      });
    }

    await supabase
      .from("otp_verifications")
      .delete()
      .eq("email", email)
      .eq("purpose", "forgot_password");

    const otp = generateOtp();

    const otp_hash = await bcrypt.hash(otp, 10);

    const expires_at = new Date(
      Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
    ).toISOString();

    const { error } = await supabase
      .from("otp_verifications")
      .insert({
        email,
        otp_hash,
        expires_at,
        purpose: "forgot_password",
        temp_data: "{}",
      });

    if (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Gagal membuat OTP",
      });
    }

    await sendOtpEmail(email, otp, user.name);

    return res.json({
      success: true,
      message: `OTP reset password telah dikirim ke ${email}`,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
}

/* =========================
   VERIFY FORGOT PASSWORD
========================= */
async function verifyForgotPassword(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "email dan otp wajib diisi",
      });
    }

    const { data: record } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("email", email)
      .eq("purpose", "forgot_password")
      .single();

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "OTP tidak ditemukan",
      });
    }

    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({
        success: false,
        message: "OTP sudah kadaluarsa",
      });
    }

    const valid = await bcrypt.compare(
      String(otp),
      record.otp_hash
    );

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: "OTP salah",
      });
    }

    const resetToken = jwt.sign(
      {
        email,
        purpose: "reset_password",
      },
      JWT_SECRET,
      {
        expiresIn: "10m",
      }
    );

    return res.json({
      success: true,
      message: "OTP valid",
      data: {
        reset_token: resetToken,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
}

/* =========================
   RESET PASSWORD
========================= */
async function resetPassword(req, res) {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json({
        success: false,
        message: "token dan new_password wajib diisi",
      });
    }

    const decoded = jwt.verify(
      token,
      JWT_SECRET
    );

    if (decoded.purpose !== "reset_password") {
      return res.status(401).json({
        success: false,
        message: "Token tidak valid",
      });
    }

    const password_hash = await bcrypt.hash(
      new_password,
      12
    );

    const { error } = await supabase
      .from("users")
      .update({
        password_hash,
      })
      .eq("email", decoded.email);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Gagal update password",
      });
    }

    await supabase
      .from("otp_verifications")
      .delete()
      .eq("email", decoded.email)
      .eq("purpose", "forgot_password");

    return res.json({
      success: true,
      message: "Password berhasil diubah",
    });
  } catch (error) {
    console.error(error);

    return res.status(401).json({
      success: false,
      message: "Token reset password tidak valid atau expired",
    });
  }
}
/* =========================
   CREATE OFFICER
========================= */
async function createOfficer(req, res) {
  try {
    const { name, email, password, phone, sector, officer_status } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "name, email, dan password wajib diisi",
      });
    }

    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Email sudah terdaftar",
      });
    }

    const password_hash = await bcrypt.hash(
      password,
      12
    );

    const { data: officer, error } = await supabase
      .from("users")
      .insert({
        name,
        email,
        password_hash,
        role: "officer",
        phone: phone || null,
        sector: sector || null,
        officer_status: officer_status || "Aktif",
      })
      .select(
        "id,name,email,role,phone,sector,officer_status,created_at"
      )
      .single();

    if (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Gagal membuat officer",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Officer berhasil dibuat",
      data: officer,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
}

/* =========================
   UPDATE PROFILE
========================= */
async function updateProfile(req, res) {
  try {
    const { name, phone, avatar_url, fcm_token } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (fcm_token !== undefined) updates.fcm_token = fcm_token;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Tidak ada data yang diupdate",
      });
    }

    const { data: user, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", req.user.id)
      .select("id, name, email, phone, role, avatar_url, created_at")
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Gagal mengupdate profil",
      });
    }

    return res.json({
      success: true,
      message: "Profil berhasil diupdate",
      data: user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
}

/* =========================
   GET OFFICERS
========================= */
async function getOfficers(req, res) {
  try {
    const { data: officers, error } = await supabase
      .from("users")
      .select("id, name, email, phone, role, avatar_url, sector, officer_status, created_at")
      .eq("role", "officer")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Gagal mengambil daftar petugas",
      });
    }

    return res.json({
      success: true,
      data: officers,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
}

/* =========================
   UPDATE OFFICER
========================= */
async function updateOfficer(req, res) {
  try {
    const { id } = req.params;
    const { name, email, phone, sector, officer_status, avatar_url, password } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (sector !== undefined) updates.sector = sector;
    if (officer_status !== undefined) updates.officer_status = officer_status;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    
    if (password) {
      updates.password_hash = await bcrypt.hash(password, 12);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Tidak ada data yang diupdate",
      });
    }

    const { data: officer, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .eq("role", "officer")
      .select("id, name, email, phone, role, avatar_url, sector, officer_status, created_at")
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Gagal mengupdate petugas",
      });
    }

    return res.json({
      success: true,
      message: "Petugas berhasil diupdate",
      data: officer,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
}

/* =========================
   EXPORTS
========================= */
module.exports = {
  register,
  verifyRegister,
  resendRegisterOtp,

  login,
  me,

  forgotPassword,
  verifyForgotPassword,
  resetPassword,

  createOfficer,
  getOfficers,
  updateOfficer,
  updateProfile,
};