-- 1. Jadual untuk Sistem Cuti Pekerja
CREATE TABLE IF NOT EXISTS staff_leaves (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    tarikh DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Jadual untuk Pengarkiban Laporan Kewangan Tahunan
CREATE TABLE IF NOT EXISTS historical_sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tahun INTEGER NOT NULL,
    bulan INTEGER NOT NULL,
    total_jualan_servis DECIMAL(10, 2) DEFAULT 0.00,
    total_jualan_produk DECIMAL(10, 2) DEFAULT 0.00,
    total_pelanggan INTEGER DEFAULT 0,
    top_staff JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tambah index untuk carian pantas
CREATE INDEX IF NOT EXISTS idx_historical_sales_tahun ON historical_sales(tahun);