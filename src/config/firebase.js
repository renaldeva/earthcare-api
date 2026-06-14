const admin = require("firebase-admin");
const path = require("path");

// Coba baca dari environment variable dulu (untuk Vercel/Production)
let serviceAccount;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Fallback baca dari file lokal (di folder src/config/)
    serviceAccount = require("./serviceAccountKey.json");
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  console.log("Firebase Admin SDK initialized successfully.");
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
    
    const response = await admin.messaging().send(message);
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
