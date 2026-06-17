# EarthCare API 🌍

Selamat datang di repositori **EarthCare API**! 

Ini adalah pusat data (*backend*) yang melayani seluruh kebutuhan aplikasi mobile EarthCare. Melalui API ini, seluruh data dari warga maupun petugas diproses, disimpan, dan disalurkan secara *real-time*.

## Apa Saja yang Dilakukan API Ini?

API ini dirancang untuk menangani berbagai fungsi utama aplikasi EarthCare secara terpusat:

*   **Manajemen Pengguna (Warga & Petugas):** Menangani proses pendaftaran warga (dengan verifikasi email), akses masuk (*login*), pengelolaan profil, hingga pendaftaran akun khusus untuk petugas dan admin.
*   **Pengolahan Laporan Lingkungan:** Menerima laporan dari warga terkait isu lingkungan (seperti jalan rusak, tumpukan sampah, atau pohon tumbang), lengkap dengan foto, deskripsi, dan titik koordinat (GPS).
*   **Pemantauan Status Laporan:** Mengontrol alur penyelesaian masalah. Saat warga melapor, petugas bisa mengubah statusnya (misal: "Sedang Dikerjakan" atau "Selesai"). Semua riwayat perubahan status ini dicatat dengan rapi.
*   **Sistem Notifikasi Pintar:** Mengirimkan notifikasi langsung (*Push Notification*) ke *handphone* pelapor setiap kali ada pembaruan atau petugas memberikan respon pada laporan mereka.
*   **Ruang Diskusi & Komentar:** Memfasilitasi interaksi dan tanya jawab langsung antara warga yang melapor dengan petugas yang menangani di kolom komentar setiap laporan.
*   **Pemetaan (Heatmap):** Menyediakan titik-titik data persebaran masalah lingkungan untuk ditampilkan dalam bentuk peta (*Heatmap*) di aplikasi.

## 📚 Lihat Dokumentasi API

Jika Anda ingin melihat rincian jalur data (*endpoint*) apa saja yang tersedia, silakan kunjungi halaman dokumentasi interaktif kami di sini:

👉 **[Dokumentasi EarthCare API (Swagger)](https://earthcare-api.vercel.app/api/docs)**

---
*EarthCare - Bersama menjaga lingkungan yang lebih bersih dan aman.* 🌱
