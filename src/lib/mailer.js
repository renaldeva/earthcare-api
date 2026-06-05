const nodemailer = require("nodemailer");

// ── Transporter Gmail ────────────────────────────────────
// Gunakan App Password Gmail, bukan password biasa
// Cara buat: Google Account → Security → 2-Step Verification → App Passwords
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,      // contoh: earthcare.app@gmail.com
    pass: process.env.GMAIL_APP_PASS,  // App Password dari Google (bukan password login)
  },
});

/**
 * Kirim email OTP ke user
 * @param {string} to     - alamat email tujuan
 * @param {string} otp    - kode OTP 6 digit
 * @param {string} name   - nama user (opsional)
 */
async function sendOtpEmail(to, otp, name = "Pengguna") {
  const mailOptions = {
    from: `"EarthCare App" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Kode Verifikasi EarthCare",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
          .header { background: #1E5C9B; padding: 28px 32px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 1px; }
          .body { padding: 32px; }
          .greeting { color: #333; font-size: 16px; margin-bottom: 16px; }
          .otp-box { background: #F0F7FF; border: 2px dashed #1E5C9B; border-radius: 10px; text-align: center; padding: 24px; margin: 24px 0; }
          .otp-label { color: #666; font-size: 13px; margin-bottom: 8px; }
          .otp-code { font-size: 42px; font-weight: bold; color: #1E5C9B; letter-spacing: 10px; }
          .info { color: #888; font-size: 13px; line-height: 1.6; margin-top: 16px; }
          .footer { background: #f9f9f9; padding: 16px 32px; text-align: center; }
          .footer p { color: #aaa; font-size: 12px; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌍 EarthCare</h1>
          </div>
          <div class="body">
            <p class="greeting">Halo, <strong>${name}</strong>!</p>
            <p style="color:#555; font-size:15px;">Gunakan kode OTP berikut untuk menyelesaikan registrasi akun EarthCare kamu:</p>
            <div class="otp-box">
              <p class="otp-label">Kode Verifikasi</p>
              <div class="otp-code">${otp}</div>
            </div>
            <p class="info">
              ⏱ Kode berlaku selama <strong>5 menit</strong>.<br>
              🔒 Jangan bagikan kode ini kepada siapapun.<br>
              ❌ Jika kamu tidak merasa mendaftar, abaikan email ini.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} EarthCare — Platform Pelaporan Lingkungan</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendOtpEmail };