const fs = require('fs');
let code = fs.readFileSync('routes/owner.js', 'utf8');

const targetStr = `  // Pemasaran (Marketing) - Ekstrak Pelanggan Tanpa Berulang
  router.get(
    "/marketing-customers",
    authenticate,
    requireRole(["owner"]),
    async (req, res) => {
      try {
        const [resCustomers, resWalkins] = await Promise.all([
          supabase.from("customers").select("name, phone, created_at").order("created_at", { ascending: false }).limit(5000),
          supabase.from("walkin_records").select("nama_pelanggan, no_phone, created_at").not("no_phone", "is", null).order("created_at", { ascending: false }).limit(5000)
        ]);`;

const replacementStr = `  // Pemasaran (Marketing) - Ekstrak Pelanggan Tanpa Berulang
  router.get(
    "/marketing-customers",
    authenticate,
    requireRole(["owner"]),
    async (req, res) => {
      try {
        // CUBA GUNA MASTER DIRECTORY DAHULU
        const { data: dirData, error: dirErr } = await supabase.from("customer_directory").select("*").order("first_created_at", { ascending: false }).limit(10000);
        
        if (!dirErr && dirData && dirData.length > 0) {
           const finalData = dirData.map(d => ({
              phone: d.phone_number,
              name: d.real_name,
              source: "Buku Log",
              created_at: d.first_created_at
           }));
           return res.json({ status: "success", count: finalData.length, data: finalData });
        }

        // FALLBACK: JIKA MASTER DIRECTORY BELUM WUJUD / KOSONG
        const [resCustomers, resWalkins] = await Promise.all([
          supabase.from("customers").select("name, phone, created_at").order("created_at", { ascending: false }).limit(5000),
          supabase.from("walkin_records").select("nama_pelanggan, no_phone, created_at").not("no_phone", "is", null).order("created_at", { ascending: false }).limit(5000)
        ]);`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('routes/owner.js', code);
console.log("Updated owner.js for WA Marketing Fallback");
