# 🌍 EarthCare API

> REST API backend untuk aplikasi pelaporan kerusakan lingkungan **EarthCare** — menjembatani kepedulian warga dengan akuntabilitas instansi pemerintah daerah.

---

## 📌 Tentang Proyek

EarthCare API adalah backend berbasis **Node.js + Express** yang melayani aplikasi mobile Flutter EarthCare. API ini dirancang agar setiap laporan lingkungan yang masuk dapat dipantau secara transparan oleh warga dan ditindaklanjuti secara terstruktur oleh petugas dinas.

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| Runtime | Node.js + Express |
| Database | PostgreSQL via **Supabase** |
| Storage | **Supabase Storage** (foto bukti) |
| Autentikasi | **JWT** (jsonwebtoken + bcryptjs) |
| Dokumentasi | Swagger UI (`/api/docs`) |
| Deploy | **Vercel** (Serverless Functions) |

---

## 👤 Role Pengguna

| Role | Deskripsi | Akses |
|---|---|---|
| `citizen` | Warga pelapor | Buat laporan, pantau laporan sendiri, terima notifikasi |
| `admin` | Petugas dinas / administrator | Semua akses citizen + update status, hapus data, lihat semua laporan |

---

## 📁 Struktur Proyek

```
earthcare-api/
├── api/
│   ├── index.js                 # Entry point Express + Swagger
│   ├── swagger.yaml             # Spesifikasi OpenAPI 3.0
│   ├── lib/
│   │   └── supabase.js          # Supabase client singleton
│   ├── middleware/
│   │   └── auth.js              # JWT authenticate + authorize (role guard)
│   ├── controllers/
│   │   ├── authController.js    # Register, Login, Get Profile
│   │   ├── reportController.js  # CRUD laporan + heatmap
│   │   ├── statusController.js  # Update status + notifikasi
│   │   └── uploadController.js  # Signed URL Supabase Storage
│   └── routes/
│       ├── auth.js
│       ├── reports.js
│       ├── status.js
│       └── upload.js
├── schema.sql                   # Skema database PostgreSQL lengkap
├── vercel.json                  # Konfigurasi deploy Vercel
├── .env.example                 # Template environment variables
└── package.json
```

---

## ✨ Fitur-Fitur API

### 🔐 1. Autentikasi (Auth)

Sistem autentikasi berbasis **JWT (JSON Web Token)** dengan masa berlaku 7 hari.

**Endpoint:**

| Method | URL | Deskripsi |
|---|---|---|
| `POST` | `/api/auth/register` | Daftar akun baru (citizen / admin) |
| `POST` | `/api/auth/login` | Login, mendapatkan token JWT |
| `GET` | `/api/auth/me` | Ambil profil user yang sedang login |

**Fitur detail:**
- Password di-hash menggunakan **bcryptjs** dengan salt 12 (sangat aman)
- Token JWT otomatis diterima langsung setelah registrasi
- Validasi duplikat email saat registrasi
- Role guard: setiap endpoint dilindungi middleware `authorize(role)`

**Contoh response login:**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": { "id": "uuid", "name": "Budi", "email": "budi@email.com", "role": "citizen" },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 📋 2. Manajemen Laporan (Reports)

Inti dari sistem EarthCare. Warga dapat membuat laporan kerusakan lingkungan dengan bukti foto terautentikasi.

**Endpoint:**

| Method | URL | Role | Deskripsi |
|---|---|---|---|
| `POST` | `/api/reports` | citizen | Buat laporan baru |
| `GET` | `/api/reports` | semua | Daftar laporan (dengan filter & pagination) |
| `GET` | `/api/reports/:id` | semua | Detail laporan + riwayat status |
| `GET` | `/api/reports/heatmap` | semua | Data koordinat untuk heatmap peta |
| `DELETE` | `/api/reports/:id` | citizen/admin | Hapus laporan |

**Kategori laporan yang tersedia:**

| Kode | Kategori |
|---|---|
| `sampah_liar` | Sampah Liar |
| `sungai_tercemar` | Sungai Tercemar |
| `pohon_tumbang` | Pohon Tumbang |
| `banjir` | Banjir |
| `polusi_udara` | Polusi Udara |
| `kerusakan_fasilitas` | Kerusakan Fasilitas |
| `lainnya` | Lainnya |

**Fitur detail:**
- `report_code` unik dibuat otomatis dengan format `EC-<timestamp>-<id>` (contoh: `EC-1716123456-ABCDEF`)
- Mendukung `photo_metadata` untuk menyimpan data GPS, timestamp, dan akurasi dari watermark kamera
- Filter laporan berdasarkan `category`, `status`, dan `user_id`
- Pagination dengan `page` dan `limit`
- Citizen hanya bisa melihat laporan miliknya sendiri; admin melihat semua

---

### 📸 3. Upload Foto Bukti (Upload)

Sistem upload foto yang efisien menggunakan **Supabase Storage Signed URL** — foto dikirim langsung dari Flutter ke storage tanpa melewati server API, sehingga lebih cepat dan hemat bandwidth.

**Endpoint:**

| Method | URL | Deskripsi |
|---|---|---|
| `POST` | `/api/upload/signed-url` | Minta signed URL untuk upload |
| `DELETE` | `/api/upload` | Hapus foto dari storage |

**Alur upload foto dari Flutter:**

```
Flutter App
    │
    ├─① POST /api/upload/signed-url
    │       → dapat signed_url + public_url
    │
    ├─② PUT <signed_url> (langsung ke Supabase Storage)
    │       → foto terupload tanpa lewat server
    │
    └─③ POST /api/reports
            → sertakan public_url sebagai photo_url
```

**Fitur detail:**
- Hanya menerima format `image/jpeg`, `image/png`, `image/webp`
- Path foto tersimpan per user: `photos/{userId}/{uuid}.jpg` (mencegah konflik)
- Signed URL berlaku 60 detik (keamanan)
- Citizen hanya bisa menghapus foto miliknya sendiri

---

### 🔄 4. Status & Notifikasi

Sistem pelacakan tindak lanjut yang transparan dengan 5 tahap status berurutan dan notifikasi real-time ke warga.

**Endpoint:**

| Method | URL | Role | Deskripsi |
|---|---|---|---|
| `PATCH` | `/api/status/:reportId` | admin | Update status laporan |
| `GET` | `/api/status/:reportId/history` | semua | Riwayat perubahan status |
| `GET` | `/api/status/notifications` | semua | Daftar notifikasi user |
| `PATCH` | `/api/status/notifications/:id/read` | semua | Tandai notifikasi sudah dibaca |

**Alur status laporan:**

```
  [1] received      →  Laporan diterima oleh sistem
       ↓
  [2] verified      →  Diverifikasi oleh petugas dinas
       ↓
  [3] assigned      →  Ditugaskan ke tim lapangan
       ↓
  [4] in_progress   →  Sedang dalam penanganan di lokasi
       ↓
  [5] resolved      →  Penanganan selesai ✅
```

**Fitur detail:**
- Status **tidak bisa mundur** ke tahap sebelumnya (validasi ketat)
- Setiap perubahan status wajib disertai catatan (`note`)
- Petugas dapat melampirkan foto bukti (`photo_url`) di setiap tahap
- Notifikasi otomatis dikirim ke pemilik laporan setiap kali status berubah
- Riwayat lengkap tersimpan di tabel `report_status_history` (audit trail)

---

### 🗺️ 5. Heatmap Real-time

Data koordinat laporan tersedia sebagai endpoint khusus untuk divisualisasikan sebagai heatmap interaktif pada peta di aplikasi Flutter.

```
GET /api/reports/heatmap?days=30&category=sampah_liar
```

Response berisi array titik koordinat (`latitude`, `longitude`) beserta kategori dan status, siap dikonsumsi oleh library peta seperti `flutter_map` atau `google_maps_flutter`.

---

### 📚 6. Dokumentasi Swagger UI

API dilengkapi dengan dokumentasi interaktif yang bisa diakses langsung di browser setelah deploy.

```
https://<nama-project>.vercel.app/api/docs
```

Fitur Swagger yang tersedia:
- **Try it out** — test request langsung dari browser
- **Authorize** — input token JWT sekali, berlaku untuk semua endpoint
- **Schema model** — lihat struktur request/response lengkap
- **Filter endpoint** — cari endpoint berdasarkan nama

---

## 🗄️ Skema Database

Database PostgreSQL di Supabase terdiri dari 4 tabel utama:

| Tabel | Deskripsi |
|---|---|
| `users` | Data akun pengguna (citizen & admin) |
| `reports` | Data laporan kerusakan lingkungan |
| `report_status_history` | Riwayat perubahan status setiap laporan (audit trail) |
| `notifications` | Notifikasi untuk warga pelapor |

Semua tabel menggunakan **UUID** sebagai primary key dan dilengkapi **Row Level Security (RLS)** Supabase.

---

## 🔒 Keamanan

- Semua endpoint (kecuali register & login) wajib menyertakan **Bearer Token JWT**
- Password di-hash dengan **bcryptjs salt 12** sebelum disimpan
- Role guard mencegah citizen mengakses endpoint admin
- Signed URL upload berlaku hanya **60 detik**
- Path foto dikunci per user ID untuk mencegah akses lintas user
- Service Role Key Supabase tidak pernah dikirim ke client

---

## 🚀 Menjalankan Lokal

```bash
# 1. Clone & install
git clone <repo-url>
cd earthcare-api
npm install

# 2. Buat file environment
cp .env.example .env
# Isi SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET

# 3. Jalankan server
npm start
# atau dengan auto-reload:
npx nodemon api/index.js

# 4. Buka Swagger UI
# http://localhost:3000/api/docs
```

---

## 📄 Lisensi

Project ini dibuat untuk keperluan pengembangan aplikasi EarthCare.
