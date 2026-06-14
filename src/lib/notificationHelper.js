const supabase = require("./supabase");
const { sendPushNotification } = require("../config/firebase");

/**
 * Helper untuk membuat notifikasi di database dan mengirim Push Notification via FCM
 * @param {Array|string} userIds ID user atau array ID user penerima
 * @param {string} reportId ID laporan terkait
 * @param {string} type Tipe notifikasi (misal: 'new_report', 'status_update')
 * @param {string} title Judul notifikasi
 * @param {string} body Isi pesan notifikasi
 */
async function createAndSendNotification(userIds, reportId, type, title, body) {
  try {
    const ids = Array.isArray(userIds) ? userIds : [userIds];
    if (ids.length === 0) return;

    // 1. Simpan ke database notifications
    const notificationPayload = ids.map((id) => ({
      user_id: id,
      report_id: reportId,
      type,
      title,
      body,
      is_read: false,
    }));
    await supabase.from("notifications").insert(notificationPayload);

    // 2. Kirim Push Notification via Firebase
    const { data: users } = await supabase
      .from("users")
      .select("fcm_token")
      .in("id", ids);

    if (users && users.length > 0) {
      for (const user of users) {
        if (user.fcm_token) {
          await sendPushNotification(user.fcm_token, title, body, {
            reportId: reportId.toString(),
            type,
          });
        }
      }
    }
  } catch (error) {
    console.error("Error in createAndSendNotification helper:", error);
  }
}

module.exports = {
  createAndSendNotification,
};
