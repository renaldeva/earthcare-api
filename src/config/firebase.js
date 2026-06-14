const admin = require("firebase-admin");
const path = require("path");

// Resolve the path to serviceAccountKey.json at the root of the backend folder
const serviceAccountPath = path.resolve(__dirname, "../../serviceAccountKey.json");

try {
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  console.log("Firebase Admin SDK initialized successfully.");
} catch (error) {
  console.error("Failed to initialize Firebase Admin SDK. Please ensure serviceAccountKey.json exists in the root folder.", error.message);
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
