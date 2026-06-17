# EarthCare API 🌍

EarthCare API adalah *backend service* untuk platform pelaporan lingkungan. API ini melayani aplikasi _mobile_ (Flutter) untuk menangani sistem pengguna, pelaporan, diskusi, dan notifikasi.

## 🚀 Fitur Utama

- **Autentikasi**: Login, Register (dengan OTP email), Lupa Password, dan pengaturan Profil.
- **Pelaporan Lingkungan**: Membuat laporan dengan foto dan lokasi GPS, serta melihat peta (Heatmap).
- **Status & Riwayat**: Pembaruan status laporan oleh petugas secara *real-time*.
- **Push Notifications**: Notifikasi instan ke HP pengguna (via Firebase).
- **Diskusi**: Fitur komentar di setiap laporan.

## 🛠️ Tech Stack

- **Node.js & Express.js**
- **Supabase** (Database PostgreSQL & Storage Foto)
- **Firebase Admin SDK** (Push Notification)
- **Vercel** (Hosting API)

## 📚 Dokumentasi API

Anda bisa mencoba langsung semua *endpoint* API (Swagger) melalui tautan berikut:

👉 **[https://earthcare-api.vercel.app/api/docs](https://earthcare-api.vercel.app/api/docs)**

## 💻 Cara Menjalankan di Komputer Lokal

1. **Clone repositori**
   ```bash
   git clone https://github.com/renaldeva/earthcare-api.git
   cd earthcare-api
   ```

2. **Install dependensi**
   ```bash
   npm install
   ```

3. **Buat file `.env`**
   Buat file bernama `.env` dan isi dengan kunci rahasia berikut:
   ```env
   PORT=3000
   JWT_SECRET=rahasia_jwt
   SUPABASE_URL=url_supabase_anda
   SUPABASE_SERVICE_ROLE_KEY=kunci_supabase_anda
   FIREBASE_SERVICE_ACCOUNT=kunci_firebase_json_anda
   GMAIL_USER=email_anda@gmail.com
   GMAIL_APP_PASS=app_password_email_anda
   ```

4. **Jalankan server**
   ```bash
   npm run dev
   ```

5. **Selesai!** 
   API sekarang berjalan di `http://localhost:3000`. Buka `http://localhost:3000/api/docs` untuk melihat dokumentasi API di komputer Anda.

---
*Dibuat untuk lingkungan yang lebih baik.* 🌱
