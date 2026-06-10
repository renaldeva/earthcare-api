-- Migration: Tambah kolom sektor dan status petugas pada tabel users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS sector VARCHAR(255),
ADD COLUMN IF NOT EXISTS officer_status VARCHAR(50) DEFAULT 'Aktif';

-- Opsional: Mengupdate officer_status petugas lama (jika ada) agar default menjadi 'Aktif'
UPDATE users SET officer_status = 'Aktif' WHERE role = 'officer' AND officer_status IS NULL;

-- Tambah kolom assigned_officer_id pada tabel reports untuk menyimpan petugas yang ditugaskan
ALTER TABLE reports
ADD COLUMN IF NOT EXISTS assigned_officer_id UUID REFERENCES users(id);
