const supabase = require("../config/db");
const nodemailer = require("nodemailer");
const { Parser } = require("json2csv");
const AdmZip = require("adm-zip");
const axios = require("axios");

// Fungsi Ekstrak Nama Fail Resit
const extractFilename = (url) => {
  if (!url || typeof url !== "string") return null;
  const parts = url.split("/");
  return parts[parts.length - 1];
};

// =====================================
// 1. PEMBERSIHAN HARIAN (Auto-Delete 1 Bulan)
// =====================================
async function runDailyCleanup() {
  try {
    console.log("Memulakan Pembersihan Harian (Resit Ditolak > 1 Bulan)...");
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const dateStr = oneMonthAgo.toISOString();

    const tables = ["booking_records", "treatment_records", "oncall_records", "product_orders"];
    
    for (let table of tables) {
      const { data } = await supabase
        .from(table)
        .select("id, no_booking, resit")
        .eq("status", "Ditolak")
        .lt("created_at", dateStr);
        
      if (data && data.length > 0) {
        const filesToDelete = data.map(r => extractFilename(r.resit)).filter(f => f);
        if (filesToDelete.length > 0) {
          await supabase.storage.from("receipts").remove(filesToDelete);
        }
        const ids = data.map(r => r.id || r.no_booking);
        if (ids.length > 0) {
            const pk = table === "product_orders" ? "id" : "no_booking";
            await supabase.from(table).delete().in(pk, ids);
        }
      }
    }
    console.log("Selesai Pembersihan Harian.");
  } catch (e) {
    console.error("Ralat Pembersihan Harian:", e);
  }
}

// =====================================
// 2. LAPORAN BULANAN (CSV + ZIP Resit)
// =====================================
async function runMonthlyArchive(isTest = false, targetEmail = "") {
  try {
    console.log("Memulakan Proses Laporan Bulanan (CSV & ZIP)...");
    const now = new Date();
    const targetMonth = now.getDate() <= 5 ? now.getMonth() : now.getMonth() + 1; // 1-indexed
    const targetYear = now.getDate() <= 5 && now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    
    const startDate = new Date(targetYear, targetMonth - 1, 1).toISOString();
    const endDate = new Date(targetYear, targetMonth, 1).toISOString();

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

    let allRawCsvData = [];
    let zip = new AdmZip();
    let hasImages = false;

    const processData = async (records, category) => {
      for (let r of (records || [])) {
        if (r.status === "Menunggu Pengesahan" || r.status === "Ditolak") continue;

        let price = parseFloat(r.harga_rm) || 0;
        let fee = parseFloat(r.service_fee || r.shipping_fee) || 0;
        let staffName = r.staff ? r.staff.username : "-";

        allRawCsvData.push({
          Tarikh: r.tarikh || r.created_at,
          Masa: r.masa || "-",
          Kategori: category,
          Pelanggan: r.nama_pelanggan || r.nama_pembeli || "-",
          Staf: staffName,
          Harga_RM: price,
          Yuran_RM: fee,
          Total_RM: price + fee,
          Status: r.status
        });

        if (r.resit && r.resit.startsWith("http")) {
          try {
            const response = await axios.get(r.resit, { responseType: 'arraybuffer' });
            const filename = `${category}_${r.no_booking || r.id}.jpg`;
            zip.addFile(filename, Buffer.from(response.data, "binary"));
            hasImages = true;
          } catch (imgErr) {
            console.error(`Gagal muat turun resit: ${r.resit}`);
          }
        }
      }
    };

    await processData(bookings, "Booking");
    await processData(walkins, "Walk-In");
    await processData(oncalls, "On-Call");
    await processData(treatments, "Treatment");
    await processData(products, "Produk");

    let csvData = allRawCsvData.length > 0 ? new Parser().parse(allRawCsvData) : "Tiada Rekod Bulan Ini.";
    let zipUrl = "";
    if (hasImages) {
      const zipBuffer = zip.toBuffer();
      const zipFilename = `Arkib_Resit_${targetYear}_${targetMonth}.zip`;
      const { data: uploadData, error: uploadErr } = await supabase.storage.from("receipts").upload(`archives/${zipFilename}`, zipBuffer, { contentType: "application/zip", upsert: true });
      if (!uploadErr) {
        const { data: publicUrlData } = supabase.storage.from("receipts").getPublicUrl(`archives/${zipFilename}`);
        zipUrl = publicUrlData.publicUrl;
      }
    }

    let transporter;
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({ service: "gmail", auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
    } else {
      let testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({ host: "smtp.ethereal.email", port: 587, secure: false, auth: { user: testAccount.user, pass: testAccount.pass } });
    }

    const mailOptions = {
      from: '"Sistem Dinspire" <admin@dinspire.com>',
      to: targetEmail || process.env.OWNER_EMAIL || "zafran.zaidi@gmail.com",
      subject: `Laporan Bulanan Dinspire - Bulan ${targetMonth}/${targetYear}`,
      text: `Salam Tuan,\n\nDilampirkan adalah laporan CSV untuk bulan ${targetMonth}/${targetYear}.\n\n` +
            (zipUrl ? `Oleh kerana saiz gambar yang besar, kesemua resit bulan ini telah dimampatkan ke dalam fail ZIP. Sila muat turun di sini:\n${zipUrl}\n\n` : "Tiada gambar resit untuk bulan ini.\n\n") +
            `Terima kasih.`,
      attachments: [{ filename: `Laporan_Bulanan_${targetMonth}_${targetYear}.csv`, content: csvData }],
    };

    let info = await transporter.sendMail(mailOptions);
    console.log("Emel Laporan Bulanan dihantar: %s", info.messageId);
    return { status: "success", message: "Laporan Bulanan Selesai" };
  } catch (err) {
    console.error("Ralat Laporan Bulanan:", err);
    throw err;
  }
}

// =====================================
// 3. LAPORAN TAHUNAN (Master Cleanup)
// =====================================
async function runAnnualArchive(isTest = false, targetEmail = "") {
  try {
    console.log("Memulakan Proses Pengarkiban Data Tahunan (Master Cleanup)...");
    const year = new Date().getFullYear();

    const [ { data: bookings }, { data: walkins }, { data: oncalls }, { data: treatments }, { data: products } ] = await Promise.all([
      supabase.from("booking_records").select("*, staff(username)"),
      supabase.from("walkin_records").select("*, staff(username)"),
      supabase.from("oncall_records").select("*, staff(username)"),
      supabase.from("treatment_records").select("*, staff(username)"),
      supabase.from("product_orders").select("*"),
    ]);

    let monthlyData = {};
    for (let i = 1; i <= 12; i++) monthlyData[i] = { tahun: year, bulan: i, total_jualan_servis: 0, total_jualan_produk: 0, total_pelanggan: 0, staff_counts: {} };
    let allRawCsvData = [];

    const processService = (records, type) => {
      (records || []).forEach((r) => {
        if (r.status && r.status !== "Selesai" && type !== "Walk-In") return;
        let d = new Date(r.created_at || r.tarikh);
        let month = d.getMonth() + 1;
        if (!monthlyData[month]) return;
        let price = parseFloat(r.harga_rm) || 0;
        let fee = parseFloat(r.service_fee) || 0;
        monthlyData[month].total_jualan_servis += (price + fee);
        monthlyData[month].total_pelanggan += 1;
        let staffName = r.staff ? r.staff.username : "-";
        if (staffName !== "-") monthlyData[month].staff_counts[staffName] = (monthlyData[month].staff_counts[staffName] || 0) + 1;
        
        allRawCsvData.push({ Tarikh: r.tarikh, Masa: r.masa, Kategori: type, Pelanggan: r.nama_pelanggan, Staf: staffName, Harga_RM: price, Yuran_RM: fee, Total_RM: price + fee });
      });
    };

    processService(bookings, "Booking");
    processService(walkins, "Walk-In");
    processService(oncalls, "On-Call");
    processService(treatments, "Treatment");

    (products || []).forEach((p) => {
      let d = new Date(p.created_at || p.tarikh);
      let month = d.getMonth() + 1;
      if (!monthlyData[month]) return;
      let price = parseFloat(p.harga_rm) || 0;
      let shipping = parseFloat(p.shipping_fee) || 0;
      monthlyData[month].total_jualan_produk += (price + shipping);
      allRawCsvData.push({ Tarikh: p.tarikh || p.created_at, Masa: "-", Kategori: "Produk", Pelanggan: p.nama_pelanggan || p.nama_penerima || "-", Staf: "-", Harga_RM: price, Yuran_RM: shipping, Total_RM: price + shipping });
    });

    let historicalInserts = [];
    for (let i = 1; i <= 12; i++) {
      let md = monthlyData[i];
      let topStaffName = "-"; let topCount = 0;
      for (let s in md.staff_counts) { if (md.staff_counts[s] > topCount) { topCount = md.staff_counts[s]; topStaffName = s; } }
      historicalInserts.push({ tahun: md.tahun, bulan: md.bulan, total_jualan_servis: md.total_jualan_servis.toFixed(2), total_jualan_produk: md.total_jualan_produk.toFixed(2), total_pelanggan: md.total_pelanggan, top_staff: topStaffName === "-" ? null : { nama: topStaffName, jumlah_servis: topCount } });
    }

    let csvData = allRawCsvData.length > 0 ? new Parser().parse(allRawCsvData) : "Tiada Rekod Kewangan Untuk Tahun Ini.";

    let transporter;
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({ service: "gmail", auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
    } else {
      let testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({ host: "smtp.ethereal.email", port: 587, secure: false, auth: { user: testAccount.user, pass: testAccount.pass } });
    }

    const mailOptions = {
      from: '"Sistem Dinspire" <admin@dinspire.com>',
      to: targetEmail || process.env.OWNER_EMAIL || "zafran.zaidi@gmail.com",
      subject: `Laporan Kewangan Tahunan Dinspire - ${year}`,
      text: `Salam Tuan,\n\nDilampirkan adalah laporan penuh rekod transaksi dan kewangan sistem bagi tahun ${year}.\n\nKesemua rekod mentah di dalam pangkalan data berserta ribuan gambar resit kini dipadam secara kekal (Master Cleanup) untuk menjimatkan kos server.\n\nTerima kasih.`,
      attachments: [{ filename: `Laporan_Kewangan_${year}.csv`, content: csvData }],
    };

    let info = await transporter.sendMail(mailOptions);
    console.log("Emel Laporan dihantar: %s", info.messageId);

    const { error: insertErr } = await supabase.from("historical_sales").insert(historicalInserts);
    if (insertErr) throw new Error("Gagal menyimpan historical_sales");

    console.log("Memadam semua fail gambar resit dari storan...");
    let allImages = [];
    [bookings, walkins, oncalls, treatments, products].forEach(arr => {
      (arr || []).forEach(r => { if (r.resit) { const fn = extractFilename(r.resit); if (fn && !fn.endsWith(".zip")) allImages.push(fn); } });
    });
    
    const chunkSize = 100;
    for (let i = 0; i < allImages.length; i += chunkSize) {
      await supabase.storage.from("receipts").remove(allImages.slice(i, i + chunkSize));
    }

    console.log("Memadam semua rekod mentah dari pangkalan data...");
    const dummyFilterId = "00000000-0000-0000-0000-000000000000";
    await Promise.all([
      supabase.from("booking_records").delete().neq("id", dummyFilterId),
      supabase.from("walkin_records").delete().neq("id", dummyFilterId),
      supabase.from("oncall_records").delete().neq("id", dummyFilterId),
      supabase.from("treatment_records").delete().neq("id", dummyFilterId),
      supabase.from("product_orders").delete().neq("id", dummyFilterId),
    ]);

    console.log("Master Cleanup Selesai!");
    return { status: "success", message: "Pengarkiban Tahunan Selesai" };

  } catch (err) {
    console.error("Ralat Pengarkiban Tahunan:", err);
    throw err;
  }
}

module.exports = { runAnnualArchive, runMonthlyArchive, runDailyCleanup };
