-- Migration: Tabel untuk penugasan multi-petugas ke laporan

CREATE TABLE IF NOT EXISTS report_assignees (
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  officer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (report_id, officer_id)
);

-- Opsional: Jika kita ingin memigrasi data dari kolom lama (assigned_officer_id) ke tabel baru
INSERT INTO report_assignees (report_id, officer_id)
SELECT id, assigned_officer_id 
FROM reports 
WHERE assigned_officer_id IS NOT NULL
ON CONFLICT (report_id, officer_id) DO NOTHING;
