require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const YAML = require("yamljs");

const app = express();

/* ==================================================
   MIDDLEWARE
================================================== */

app.use(cors({ origin: "*" }));

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

/* ==================================================
   SWAGGER JSON
================================================== */

app.get("/api/docs-json", (req, res) => {
  try {
    const swaggerPath = path.join(
      __dirname,
      "../src/swagger.yaml"
    );

    const swaggerDocument =
      YAML.load(swaggerPath);

    return res.json(swaggerDocument);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Gagal memuat swagger.yaml",
    });
  }
});

/* ==================================================
   SWAGGER UI
================================================== */

app.get("/api/docs", (req, res) => {
  return res.redirect(
    "https://petstore.swagger.io/?url=https://earthcare-api.vercel.app/api/docs-json"
  );
});

/* ==================================================
   ROOT
================================================== */

app.get("/", (req, res) => {
  return res.json({
    success: true,
    app: "EarthCare API",
    version: "1.0.0",
    status: "running",

    docs: "/api/docs",

    endpoints: {
      auth: {
        register: "/api/auth/register",
        verifyRegister:
          "/api/auth/register/verify",
        resendOtp:
          "/api/auth/register/resend-otp",

        login: "/api/auth/login",

        forgotPassword:
          "/api/auth/forgot-password",

        verifyForgotPassword:
          "/api/auth/forgot-password/verify",

        resetPassword:
          "/api/auth/reset-password",

        me: "/api/auth/me",

        officers:
          "/api/auth/officers",
      },

      reports: "/api/reports",

      upload: "/api/upload",

      status: "/api/status",
    },
  });
});

/* ==================================================
   ROUTES
================================================== */

app.use(
  "/api/auth",
  require("../src/routes/auth")
);

app.use(
  "/api/reports",
  require("../src/routes/reports")
);

app.use(
  "/api/upload",
  require("../src/routes/upload")
);

app.use(
  "/api/status",
  require("../src/routes/status")
);

/* ==================================================
   TEST ROUTE
================================================== */

app.get("/api/test-js", (req, res) => {
  res.type("application/javascript");

  res.send(
    "console.log('EarthCare API JS OK');"
  );
});

/* ==================================================
   404 HANDLER
================================================== */

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Endpoint tidak ditemukan",
  });
});

/* ==================================================
   GLOBAL ERROR HANDLER
================================================== */

app.use((err, req, res, next) => {
  console.error(err);

  return res.status(
    err.status || 500
  ).json({
    success: false,
    message:
      err.message ||
      "Internal Server Error",
  });
});

module.exports = app;