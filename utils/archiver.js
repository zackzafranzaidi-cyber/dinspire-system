const supabase = require("../config/db");

async function generateMonthlyArchiveData(targetMonth, targetYear) {
  try {
    console.log(`Menjana Laporan Bulanan untuk: ${targetMonth}/${targetYear}`);
    
    console.log("Memuat turun data dari Supabase...");
    const startDate = new Date(`${targetYear}-${String(targetMonth).padStart(2, '0')}-01T00:00:00+08:00`).toISOString();
    const nextMonth = parseInt(targetMonth) === 12 ? 1 : parseInt(targetMonth) + 1;
    const nextYear = parseInt(targetMonth) === 12 ? parseInt(targetYear) + 1 : parseInt(targetYear);
    const endDate = new Date(`${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00+08:00`).toISOString();

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
    console.error("Ralat Laporan Bulanan:", error);
    throw error;
  }
}

module.exports = { generateMonthlyArchiveData };
