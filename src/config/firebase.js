const admin = require("firebase-admin");
const { getMessaging } = require("firebase-admin/messaging");
const { getApps } = require("firebase-admin/app");
const path = require("path");

// Coba baca dari environment variable dulu (untuk Vercel/Production)
let serviceAccount;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (parseError) {
      console.error("CRITICAL ERROR: FIREBASE_SERVICE_ACCOUNT is not valid JSON. Please check Vercel Environment Variables.", parseError.message);
    }
  } else {
    // Fallback baca dari file lokal jika ada
    try {
      serviceAccount = require("./serviceAccountKey.json");
    } catch (e) {
      console.warn("serviceAccountKey.json not found, falling back to other methods if available.");
    }
  }

  if (serviceAccount) {
    if (!getApps().length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("Firebase Admin SDK initialized successfully.");
    }
  } else {
    console.error("CRITICAL ERROR: Firebase Admin SDK not initialized! No credentials provided. Push notifications will crash.");
  }
} catch (error) {
  console.error("Failed to initialize Firebase Admin SDK.", error.message);
}

const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) return;
  
  try {
    if (!getApps().length) {
      console.error("Cannot send push notification: Firebase app is not initialized.");
      return;
    }

    const message = {
      notification: {
        title,
        body
      },
      data,
      token: fcmToken
    };
    
    const response = await getMessaging().send(message);
    console.log("Successfully sent push notification:", response);
    return response;
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
};

module.exports = {
  admin,
  sendPushNotification
};
