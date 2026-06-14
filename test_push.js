require('dotenv').config();
const supabase = require('./src/lib/supabase');
const { sendPushNotification } = require('./src/config/firebase');

async function testPush() {
  console.log("Fetching users with fcm_token...");
  const { data: users, error } = await supabase.from('users').select('id, email, fcm_token').not('fcm_token', 'is', null);
  
  if (error) {
    console.error("Error fetching users:", error);
    return;
  }

  if (!users || users.length === 0) {
    console.log("No users found with an fcm_token in the database. This means the Flutter app has not sent the token to the backend yet.");
    return;
  }

  console.log(`Found ${users.length} users with fcm_token.`);
  
  for (const user of users) {
    console.log(`Sending test notification to user ${user.email} (ID: ${user.id})...`);
    try {
      const response = await sendPushNotification(
        user.fcm_token,
        "Test Notification",
        "This is a test notification from the backend to verify FCM.",
        { type: "test" }
      );
      console.log("Result:", response);
    } catch (e) {
      console.error("Failed to send to", user.email, e);
    }
  }
}

testPush().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
