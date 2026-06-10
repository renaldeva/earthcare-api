const express = require("express");
const router = express.Router();

const {
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
} = require("../controllers/authController");

const {
  authenticate,
  authorize,
} = require("../middleware/auth");

/*
|--------------------------------------------------------------------------
| REGISTER + OTP
|--------------------------------------------------------------------------
*/

// kirim OTP registrasi
router.post("/register", register);

// verifikasi OTP registrasi
router.post("/register/verify", verifyRegister);

// kirim ulang OTP registrasi
router.post(
  "/register/resend-otp",
  resendRegisterOtp
);

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

router.post("/login", login);

/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD
|--------------------------------------------------------------------------
*/

// kirim OTP reset password
router.post(
  "/forgot-password",
  forgotPassword
);

// verifikasi OTP reset password
router.post(
  "/forgot-password/verify",
  verifyForgotPassword
);

// reset password
router.post(
  "/reset-password",
  resetPassword
);

/*
|--------------------------------------------------------------------------
| PROFILE
|--------------------------------------------------------------------------
*/

router.get(
  "/me",
  authenticate,
  me
);

router.put(
  "/profile",
  authenticate,
  updateProfile
);

/*
|--------------------------------------------------------------------------
| OFFICER MANAGEMENT
|--------------------------------------------------------------------------
*/

router.post(
  "/officers",
  authenticate,
  authorize("admin"),
  createOfficer
);

router.get(
  "/officers",
  authenticate,
  authorize("admin"),
  getOfficers
);

router.put(
  "/officers/:id",
  authenticate,
  authorize("admin"),
  updateOfficer
);

module.exports = router;