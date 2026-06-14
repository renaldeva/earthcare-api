const admin = require("firebase-admin");
const { getMessaging } = require("firebase-admin/messaging");
const path = require("path");

// Coba baca dari environment variable dulu (untuk Vercel/Production)
let serviceAccount;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Fallback baca dari file lokal jika ada
    try {
      serviceAccount = require("./serviceAccountKey.json");
    } catch (e) {
      console.warn("serviceAccountKey.json not found, falling back to other methods if available.");
    }
  }

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } else {
    console.warn("Firebase Admin SDK not initialized: No credentials provided.");
  }
} catch (error) {
  console.error("Failed to initialize Firebase Admin SDK.", error.message);
}

const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) return;
  
  try {
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
