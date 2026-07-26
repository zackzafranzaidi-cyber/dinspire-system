require('dotenv').config();
const supabase = require('./config/db');

async function fixLocalDb() {
  console.log("Menyemak dan membaiki pangkalan data (Local)...");

  // 1. Cipta Storage Bucket 'shop_images' jika belum wujud
  console.log("1. Menyemak Storage Bucket 'shop_images'...");
  const { data: buckets, error: getBucketErr } = await supabase.storage.listBuckets();
  if (getBucketErr) {
    console.error("Ralat menyemak bucket:", getBucketErr);
  } else {
    const hasShopImages = buckets.find(b => b.name === 'shop_images');
    if (!hasShopImages) {
      const { data, error } = await supabase.storage.createBucket('shop_images', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      if (error) {
        console.error("Gagal mencipta bucket 'shop_images':", error);
      } else {
        console.log("   ✅ Bucket 'shop_images' berjaya dicipta!");
      }
    } else {
      console.log("   ✅ Bucket 'shop_images' sudah sedia wujud.");
    }
  }

  // 2. Semak Jadual general_staff
  console.log("2. Menyemak Jadual 'general_staff'...");
  const { error: tableErr } = await supabase.from('general_staff').select('id').limit(1);
  if (tableErr && tableErr.code === '42P01') {
    // Jadual tiada, kita perlu cipta
    console.log("   ⚠️ Jadual 'general_staff' tidak dijumpai. Membina jadual...");
    
    // Kita gunakan rpc jika ada, tapi takpe, cara paling pantas di Node.js adalah melalui 
    // SQL query terus jika postgres role. Tapi sebab kita guna service_role di REST API,
    // kita tak boleh CREATE TABLE terus.
    console.log("   Sila salin kod SQL di bawah dan RUN di SQL Editor (Supabase Studio):");
    console.log(`
CREATE TABLE public.general_staff (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  username character varying NOT NULL UNIQUE,
  password_hash text NOT NULL,
  must_change_password boolean DEFAULT true,
  reset_requested boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT general_staff_pkey PRIMARY KEY (id)
);
GRANT ALL ON TABLE public.general_staff TO postgres, anon, authenticated, service_role;
    `);
  } else if (tableErr) {
    console.error("   Ralat jadual:", tableErr);
  } else {
    console.log("   ✅ Jadual 'general_staff' sudah sedia wujud.");
  }

  // Cuba ambil error spesifik /api/admin/save dengan mensimulasikan save
  console.log("Selesai semakan awal.");
}

fixLocalDb();
