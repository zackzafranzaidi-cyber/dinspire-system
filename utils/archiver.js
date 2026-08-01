const supabase = require("../config/db");

async function generateArchiveDataByDateRange(startDate, endDate) {
  try {
    const [
      { data: bookings },
      { data: walkins },
      { data: oncalls },
      { data: treatments },
      { data: products },
    ] = await Promise.all([
      supabase.from("booking_records").select("*, staff(username)").gte("created_at", startDate).lt("created_at", endDate),
      supabase.from("walkin_records").select("*, staff(username)").gte("created_at", startDate).lt("created_at", endDate),
      supabase.from("oncall_records").select("*, staff(username)").gte("created_at", startDate).lt("created_at", endDate),
      supabase.from("treatment_records").select("*, staff(username)").gte("created_at", startDate).lt("created_at", endDate),
      supabase.from("product_orders").select("*").gte("created_at", startDate).lt("created_at", endDate),
    ]);

    let rawData = {
      Booking: [],
      WalkIn: [],
      OnCall: [],
      Treatment: [],
      Produk: []
    };
    let imageUrls = [];

    const processData = (records, category) => {
      for (let r of (records || [])) {
        if (r.status === "Pending Verification" || r.status === "Rejected") continue;

        let staffName = r.staff?.username || r.staff_id || "-";
        let price = parseFloat(r.harga_rm || r.total_price || 0);
        let fee = parseFloat(r.service_fee || r.shipping_fee || 0);
        let dateStr = new Date(r.created_at).toLocaleDateString("ms-MY", { timeZone: "Asia/Kuala_Lumpur" });

        let receiptName = "Tiada Resit";

        // Simpan url gambar jika wujud dan merupakan pautan sah (abaikan token FPX_PAID)
        if (r.resit && typeof r.resit === 'string' && r.resit.startsWith('http')) {
          const publicUrl = r.resit; // Ia sudah pun URL penuh di pangkalan data
          // Format nama fail: Kategori_NoBooking_Tarikh.jpg
          const cleanDate = dateStr.replace(/\//g, "-");
          // Kita cuba dapatkan extension dari hujung URL
          let ext = r.resit.split('.').pop() || "jpg";
          if (ext.length > 4) ext = "jpg"; // fallback jika tiada extension dalam URL
          receiptName = `${category}_${r.no_booking || r.id}_${cleanDate}.${ext}`;
          imageUrls.push({ url: publicUrl, name: receiptName });
        } else if (r.resit && typeof r.resit === 'string' && r.resit.startsWith('FPX')) {
          receiptName = "Transaksi FPX";
        }

        rawData[category].push({
          Tarikh: dateStr,
          Masa: new Date(r.created_at).toLocaleTimeString("ms-MY", { timeZone: "Asia/Kuala_Lumpur" }),
          Kategori: category,
          No_Booking: r.no_booking || r.id,
          Pelanggan: r.nama_pelanggan || r.nama_pembeli || "-",
          Staf: staffName,
          Harga_RM: price,
          Yuran_RM: fee,
          Total_RM: price + fee,
          Status: r.status,
          Nama_Resit: receiptName
        });
      }
    };

    console.log("Memproses data laporan...");
    processData(bookings, "Booking");
    processData(walkins, "WalkIn");
    processData(oncalls, "OnCall");
    processData(treatments, "Treatment");
    processData(products, "Produk");
    
    return { rawData, imageUrls };

  } catch (error) {
    console.error("Ralat Menjana Laporan:", error);
    throw error;
  }
}

async function generateMonthlyArchiveData(targetMonth, targetYear) {
  console.log(`Menjana Laporan Bulanan untuk: ${targetMonth}/${targetYear}`);
  const startDate = new Date(`${targetYear}-${String(targetMonth).padStart(2, '0')}-01T00:00:00+08:00`).toISOString();
  const nextMonth = parseInt(targetMonth) === 12 ? 1 : parseInt(targetMonth) + 1;
  const nextYear = parseInt(targetMonth) === 12 ? parseInt(targetYear) + 1 : parseInt(targetYear);
  const endDate = new Date(`${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00+08:00`).toISOString();

  return await generateArchiveDataByDateRange(startDate, endDate);
}

module.exports = { generateMonthlyArchiveData, generateArchiveDataByDateRange, pruneYearlyData };

async function pruneYearlyData() {
  try {
    const lastYear = new Date().getFullYear() - 1;
    console.log(`[PRUNING] Memulakan pembersihan & kompresi data mentah untuk tahun ${lastYear}...`);
    
    // 1. KOMPRESI DATA KE historical_sales
    for (let month = 1; month <= 12; month++) {
       const startDate = new Date(`${lastYear}-${String(month).padStart(2, '0')}-01T00:00:00+08:00`).toISOString();
       const nextMonth = month === 12 ? 1 : month + 1;
       const nextYear = month === 12 ? lastYear + 1 : lastYear;
       const endDate = new Date(`${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00+08:00`).toISOString();
       
       const [ { data: b }, { data: w }, { data: o }, { data: t }, { data: p } ] = await Promise.all([
          supabase.from("booking_records").select("harga_rm, staff_id").gte("created_at", startDate).lt("created_at", endDate).eq("status", "Selesai"),
          supabase.from("walkin_records").select("harga_rm, staff_id").gte("created_at", startDate).lt("created_at", endDate),
          supabase.from("oncall_records").select("harga_rm, staff_id").gte("created_at", startDate).lt("created_at", endDate).eq("status", "Selesai"),
          supabase.from("treatment_records").select("harga_rm, staff_id").gte("created_at", startDate).lt("created_at", endDate).eq("status", "Selesai"),
          supabase.from("product_orders").select("total_price").gte("created_at", startDate).lt("created_at", endDate).eq("status", "Completed")
       ]);
       
       let total_servis = 0;
       let total_pelanggan = 0;
       let staffCounts = {};
       
       const processService = (records) => {
          if(!records) return;
          records.forEach(r => {
             total_servis += parseFloat(r.harga_rm || 0);
             total_pelanggan += 1;
             if (r.staff_id) {
                staffCounts[r.staff_id] = (staffCounts[r.staff_id] || 0) + 1;
             }
          });
       };
       
       processService(b); processService(w); processService(o); processService(t);
       
       let total_produk = 0;
       if (p) {
          p.forEach(r => total_produk += parseFloat(r.total_price || 0));
       }
       
       if (total_pelanggan > 0 || total_produk > 0) {
          // Check if already exists
          const { data: exist } = await supabase.from("historical_sales").select("id").eq("tahun", lastYear).eq("bulan", month).limit(1);
          if (!exist || exist.length === 0) {
             await supabase.from("historical_sales").insert({
                tahun: lastYear,
                bulan: month,
                total_jualan_servis: total_servis,
                total_jualan_produk: total_produk,
                total_pelanggan: total_pelanggan,
                top_staff: staffCounts
             });
          }
       }
    }
    
    console.log(`[PRUNING] Data kompresi ${lastYear} berjaya disimpan.`);
    
    // 2. PADAM DATA MENTAH
    const startYear = new Date(`${lastYear}-01-01T00:00:00+08:00`).toISOString();
    const endYear = new Date(`${lastYear + 1}-01-01T00:00:00+08:00`).toISOString();
    
    let filesToDelete = [];
    const tables = ["booking_records", "walkin_records", "oncall_records", "treatment_records", "product_orders"];
    
    for (const tbl of tables) {
       const { data: records } = await supabase.from(tbl)
           .select("resit")
           .gte("created_at", startYear)
           .lt("created_at", endYear)
           .neq("resit", "TIADA")
           .not("resit", "is", null);
       
       if (records && records.length > 0) {
           for (const rec of records) {
               if (rec.resit && rec.resit.startsWith("http")) {
                   const parts = rec.resit.split("/");
                   const filename = parts[parts.length - 1];
                   if (filename) filesToDelete.push(filename);
               } else if (rec.resit && !rec.resit.startsWith("FPX")) {
                   filesToDelete.push(rec.resit);
               }
           }
       }
    }
    
    if (filesToDelete.length > 0) {
       filesToDelete = [...new Set(filesToDelete)];
       console.log(`[PRUNING] Menghapus ${filesToDelete.length} resit gambar dari storage...`);
       for (let i = 0; i < filesToDelete.length; i += 100) {
          const chunk = filesToDelete.slice(i, i + 100);
          await supabase.storage.from("receipts").remove(chunk);
       }
    }
    
    for (const tbl of tables) {
       console.log(`[PRUNING] Menghapus data dari ${tbl}...`);
       await supabase.from(tbl).delete().gte("created_at", startYear).lt("created_at", endYear);
    }
    
    console.log(`[PRUNING] Selesai. Data mentah tahun ${lastYear} telah dipadamkan.`);

  } catch (error) {
    console.error(`[PRUNING] Ralat ketika membersihkan data tahunan:`, error);
  }
}

