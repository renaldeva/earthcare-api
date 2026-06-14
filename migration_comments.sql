-- MIGRATION: Tambahkan tabel report_comments untuk fitur diskusi laporan
-- Jalankan kode ini di SQL Editor pada *dashboard* Supabase Anda.

CREATE TABLE report_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Atur Row Level Security (RLS) jika sebelumnya sudah diaktifkan di tabel lain
ALTER TABLE report_comments ENABLE ROW LEVEL SECURITY;

-- Buat policy agar semua orang yang login bisa membaca komentar
CREATE POLICY "Public profiles are viewable by everyone."
ON report_comments FOR SELECT
USING ( auth.role() = 'authenticated' );

-- Buat policy agar semua orang yang login bisa menambahkan komentar
CREATE POLICY "Users can insert their own comments."
ON report_comments FOR INSERT
WITH CHECK ( auth.uid() = user_id );

-- (Opsional) Buat index untuk mempercepat query komentar berdasarkan report_id
CREATE INDEX idx_report_comments_report_id ON report_comments(report_id);
