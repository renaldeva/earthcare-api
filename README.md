# EarthCare API 🌍

EarthCare API adalah *backend service* utama untuk aplikasi pelaporan lingkungan berbasis lokasi. API ini memproses seluruh arus data aplikasi, mulai dari manajemen pengguna, pengelolaan laporan masalah lingkungan, interaksi antarpengguna, hingga pengiriman notifikasi pintar.

## 🚀 Fitur Utama

- **Autentikasi (JWT & OTP)**: Sistem pendaftaran warga dengan verifikasi email OTP, fitur lupa kata sandi, serta hak akses berlapis (*role-based access* untuk `citizen`, `officer`, dan `admin`).
- **Pelaporan Lingkungan**: Endpoint untuk menerima keluhan masalah lingkungan (seperti jalan rusak atau tumpukan sampah liar) beserta unggahan foto bukti dan titik koordinat (GPS).
- **Manajemen Status Berjenjang**: Sistem pelacakan progres laporan yang diperbarui langsung oleh petugas (mulai dari diterima, diverifikasi, ditugaskan, dalam penanganan, hingga selesai). Seluruh riwayat perubahan tercatat otomatis.
- **Push Notifications**: Pengiriman notifikasi instan (_push notification_) ke _smartphone_ pelapor setiap kali ada pembaruan status atau informasi baru.
- **Ruang Diskusi (Komentar)**: Memfasilitasi interaksi dan diskusi secara _real-time_ antara pelapor warga dan petugas yang sedang menangani keluhan.
- **Pemetaan (Heatmap)**: Menyajikan data agregat untuk memvisualisasikan area dengan frekuensi laporan tertinggi melalui fitur peta (Heatmap).

## 🛠️ Tech Stack

API ini dibangun dengan arsitektur modern untuk menjamin kecepatan, keamanan, dan skalabilitas:

- **Runtime Environment**: Node.js
- **Web Framework**: Express.js
- **Database & Cloud Storage**: Supabase (PostgreSQL)
- **Push Notification Service**: Firebase Cloud Messaging (Firebase Admin SDK)
- **Email Service (OTP)**: Nodemailer (via SMTP)
- **API Documentation**: Swagger UI
- **Hosting / Deployment**: Vercel Serverless

## 📚 Dokumentasi API (Swagger)

Seluruh struktur data, rute (_endpoints_), dan panduan _request/response_ API ini telah didokumentasikan secara rapi. Anda dapat membaca, mengeksplorasi, dan mengujinya secara interaktif melalui tautan Swagger UI berikut:

👉 **[https://earthcare-api.vercel.app/api/docs](https://earthcare-api.vercel.app/api/docs)**

---
*EarthCare - Bersama menjaga lingkungan yang lebih bersih dan aman.* 
