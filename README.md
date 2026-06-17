# EarthCare API 🌍

EarthCare API adalah *backend service* untuk platform pelaporan lingkungan berbasis lokasi. API ini melayani aplikasi _mobile_ (Flutter) untuk menangani autentikasi pengguna, manajemen laporan lingkungan, interaksi antarpengguna (komentar), serta sistem notifikasi otomatis.

API ini dibangun menggunakan **Node.js** dengan *framework* **Express** dan terintegrasi dengan **Supabase** (sebagai *database* PostgreSQL dan manajemen penyimpanan), serta **Firebase Admin SDK** (untuk pengiriman *Push Notification* ke perangkat).

## 🚀 Fitur Utama

- **Autentikasi (JWT & OTP)**: Registrasi akun dengan verifikasi email OTP, fitur lupa kata sandi (*forgot password*), serta _role-based access_ (`citizen`, `officer`, `admin`).
- **Pelaporan Lingkungan**: Warga dapat membuat laporan lingkungan (seperti tumpukan sampah, jalan rusak) dilengkapi titik koordinat GPS dan foto bukti fisik.
- **Sistem Status & Riwayat**: Status laporan akan diperbarui oleh petugas (mulai dari `received`, `verified`, `assigned`, `in_progress`, hingga `resolved`). Setiap perubahan status akan dicatat pada riwayat laporan.
- **Push Notifications**: Pengguna yang melaporkan akan mendapat notifikasi instan (_push notification_) di *smartphone* mereka setiap kali laporan diproses atau ada aktivitas baru.
- **Diskusi/Komentar**: Pengguna dapat memberikan komentar dan mendiskusikan penanganan di setiap laporan.
- **Heatmap Data**: Mendukung penyajian *raw data* laporan dalam bentuk peta *heatmap*.

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Push Notification**: Firebase Cloud Messaging (Firebase Admin SDK)
- **Email Service**: Nodemailer (Gmail SMTP)
- **Documentation**: Swagger UI
- **Deployment**: Vercel

## 📚 Dokumentasi API (Swagger)

Setelah server berjalan, Anda dapat mengakses daftar lengkap *endpoint*, format _request/response_, dan melakukan tes API secara langsung melalui Swagger UI:

👉 **`http://localhost:3000/api/docs`** (di mesin lokal)
👉 **`https://earthcare-api.vercel.app/api/docs`** (di _production_)

## ⚙️ Variabel Lingkungan (.env)

Untuk menjalankan proyek ini secara lokal, Anda perlu menyiapkan *environment variables*. Buatlah sebuah file bernama `.env` di _root directory_ proyek Anda dan isi dengan referensi berikut:

```env
# Server Port (Opsional)
PORT=3000

# Kunci Rahasia JWT
JWT_SECRET=your_super_secret_jwt_key

# Supabase Credentials (Untuk Database & Storage)
SUPABASE_URL=https://xxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Firebase Credentials (Untuk Push Notification)
# Berupa format JSON dari serviceAccountKey.json yang di-stringify (wajib ada untuk deploy Vercel)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key":"..."}

# Gmail SMTP Credentials (Untuk Pengiriman OTP via Email)
GMAIL_USER=email_anda@gmail.com
GMAIL_APP_PASS=your_gmail_app_password
```

> **Catatan untuk Firebase:** Jika Anda mengembangkan di _environment_ lokal, Anda bisa menggunakan file `src/config/serviceAccountKey.json` sebagai _fallback_ dari `FIREBASE_SERVICE_ACCOUNT`. Namun, file tersebut **harus selalu diabaikan (.gitignore)** agar kredensial Anda tidak bocor ke publik.

## 💻 Menjalankan Proyek Secara Lokal

1. **Clone repositori**
   ```bash
   git clone https://github.com/renaldeva/earthcare-api.git
   cd earthcare-api
   ```

2. **Install dependensi**
   ```bash
   npm install
   ```

3. **Atur *Environment Variables***
   Buat file `.env` berdasarkan konfigurasi di atas.

4. **Jalankan server** (menggunakan *nodemon* untuk _auto-reload_)
   ```bash
   npm run dev
   ```
   *Atau jalankan server tanpa nodemon:*
   ```bash
   npm start
   ```

5. **Akses server**
   Server akan berjalan di `http://localhost:3000`.

## 🌐 Deployment (Vercel)

Proyek ini telah dikonfigurasi untuk _deployment serverless_ di [Vercel](https://vercel.com).
Pengaturan rute *serverless functions* sudah di-set di dalam file `vercel.json` dan aplikasi akan dibaca melalui *entry point* `api/index.js`. 

Setiap kali Anda men-_push_ kode ke cabang `main` di GitHub, Vercel akan otomatis melakukan _deploy_ ulang (jika fitur CI/CD terhubung).

## 📄 Struktur Folder Utama

```text
earthcare-api/
├── api/                   # Entry point aplikasi untuk deployment Vercel (index.js)
├── src/
│   ├── config/            # Pengaturan kunci/kredensial eksternal (Firebase)
│   ├── controllers/       # Logika fungsi untuk setiap endpoint (Auth, Reports, Status, dll.)
│   ├── lib/               # Utility global (Supabase Client, Mailer, Notification Helper)
│   ├── middleware/        # Pembatas hak akses (Auth & RBAC)
│   ├── routes/            # Rute URL Express untuk masing-masing fitur
│   └── swagger.yaml       # File dokumentasi struktur API
├── .env                   # File konfigurasi rahasia (TIDAK DIPUBLIKASI)
├── vercel.json            # Konfigurasi _serverless_ Vercel
├── package.json           # Daftar pustaka NPM
└── README.md              # File ini
```

---
Dibuat dengan ❤️ untuk lingkungan yang lebih baik.
