const supabase = require("../config/db");
const nodemailer = require("nodemailer");
const { Parser } = require("json2csv");

async function runAnnualArchive(isTest = false, targetEmail = "") {
  try {
    console.log("Memulakan Proses Pengarkiban Data Tahunan...");
    const year = new Date().getFullYear();

    // 1. Tarik semua data jualan
    const [
      { data: bookings },
      { data: walkins },
      { data: oncalls },
      { data: treatments },
      { data: products },
    ] = await Promise.all([
      supabase.from("booking_records").select("*, staff(username)"),
      supabase.from("walkin_records").select("*, staff(username)"),
      supabase.from("oncall_records").select("*, staff(username)"),
      supabase.from("treatment_records").select("*, staff(username)"),
      supabase.from("product_orders").select("*"),
    ]);

    // 2. Data Aggregation (Rumusan Bulanan)
    let monthlyData = {};
    for (let i = 1; i <= 12; i++) {
      monthlyData[i] = {
        tahun: year,
        bulan: i,
        total_jualan_servis: 0,
        total_jualan_produk: 0,
        total_pelanggan: 0,
        staff_counts: {}, // Untuk mencari Top Staff
      };
    }

    let allRawCsvData = [];

    // Fungsi helper untuk memproses transaksi servis
    const processService = (records, type) => {
      (records || []).forEach((r) => {
        // Tapis rekod tidak selesai
        if (r.status && r.status !== "Selesai" && type !== "Walk-In") return;

        let d = new Date(r.created_at || r.tarikh);
        let month = d.getMonth() + 1;
        if (!monthlyData[month]) return;

        let price = parseFloat(r.harga_rm) || 0;
        let fee = parseFloat(r.service_fee) || 0;
        monthlyData[month].total_jualan_servis += (price + fee);
        monthlyData[month].total_pelanggan += 1;

        let staffName = r.staff ? r.staff.username : "-";
        if (staffName !== "-") {
          monthlyData[month].staff_counts[staffName] = (monthlyData[month].staff_counts[staffName] || 0) + 1;
        }

        allRawCsvData.push({
          Tarikh: r.tarikh,
          Masa: r.masa,
          Kategori: type,
          Pelanggan: r.nama_pelanggan,
          Staf: staffName,
          Harga_RM: price,
          Yuran_RM: fee,
          Total_RM: price + fee,
        });
      });
    };

    processService(bookings, "Booking");
    processService(walkins, "Walk-In");
    processService(oncalls, "On-Call");
    processService(treatments, "Treatment");

    // Proses Produk
    (products || []).forEach((p) => {
      let d = new Date(p.created_at || p.tarikh);
      let month = d.getMonth() + 1;
      if (!monthlyData[month]) return;

      let price = parseFloat(p.harga_rm) || 0;
      let shipping = parseFloat(p.shipping_fee) || 0;
      monthlyData[month].total_jualan_produk += (price + shipping);

      allRawCsvData.push({
        Tarikh: p.tarikh || p.created_at,
        Masa: "-",
        Kategori: "Produk",
        Pelanggan: p.nama_pelanggan || p.nama_penerima || "-",
        Staf: "-",
        Harga_RM: price,
        Yuran_RM: shipping,
        Total_RM: price + shipping,
      });
    });

    // Cari Top Staff untuk setiap bulan dan bina array untuk Supabase insert
    let historicalInserts = [];
    for (let i = 1; i <= 12; i++) {
      let md = monthlyData[i];
      let topStaffName = "-";
      let topCount = 0;
      for (let s in md.staff_counts) {
        if (md.staff_counts[s] > topCount) {
          topCount = md.staff_counts[s];
          topStaffName = s;
        }
      }

      historicalInserts.push({
        tahun: md.tahun,
        bulan: md.bulan,
        total_jualan_servis: md.total_jualan_servis.toFixed(2),
        total_jualan_produk: md.total_jualan_produk.toFixed(2),
        total_pelanggan: md.total_pelanggan,
        top_staff: topStaffName === "-" ? null : { nama: topStaffName, jumlah_servis: topCount },
      });
    }

    // 3. Jana CSV Format
    let csvData = "";
    if (allRawCsvData.length > 0) {
      const json2csvParser = new Parser();
      csvData = json2csvParser.parse(allRawCsvData);
    } else {
      csvData = "Tiada Rekod Kewangan Untuk Tahun Ini.";
    }

    // 4. Konfigurasi Nodemailer (Guna Ethereal jika tiada SMTP)
    let transporter;
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      console.log("Tiada SMTP dikesan. Menjana Ethereal Test Account...");
      let testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const mailOptions = {
      from: '"Sistem Dinspire" <admin@dinspire.com>',
      to: targetEmail || process.env.OWNER_EMAIL || "zafran.zaidi@gmail.com",
      subject: `Laporan Kewangan Tahunan Dinspire - ${year}`,
      text: `Salam Tuan,\n\nDilampirkan adalah laporan penuh rekod transaksi dan kewangan sistem bagi tahun ${year}.\n\nKesemua rekod mentah di dalam pangkalan data kini sedang dipadam dan dimampatkan secara automatik.\n\nTerima kasih.`,
      attachments: [
        {
          filename: `Laporan_Kewangan_${year}.csv`,
          content: csvData,
        },
      ],
    };

    // 5. Hantar Emel
    let info = await transporter.sendMail(mailOptions);
    console.log("Emel Laporan dihantar: %s", info.messageId);
    
    let etherealUrl = "";
    if (!process.env.SMTP_USER) {
      etherealUrl = nodemailer.getTestMessageUrl(info);
      console.log("Preview Emel (Ethereal): %s", etherealUrl);
    }

    // 6. Jika emel berjaya, kita masukkan (INSERT) data agregat ke historical_sales
    const { error: insertErr } = await supabase.from("historical_sales").insert(historicalInserts);
    if (insertErr) {
      console.error("Gagal menyimpan data mampat ke historical_sales:", insertErr);
      throw new Error("Gagal menyimpan historical_sales");
    }

    // 7. Padam data mentah dari Supabase (DELETE)
    // Walaupun DELETE tanpa filter adalah berisiko, ini adalah arahan untuk cuci semua
    // Lebih selamat guna .neq('id', '00000000-0000-0000-0000-000000000000') kerana Supabase memerlukan filter
    const dummyFilterId = "00000000-0000-0000-0000-000000000000";
    await Promise.all([
      supabase.from("booking_records").delete().neq("id", dummyFilterId),
      supabase.from("walkin_records").delete().neq("id", dummyFilterId),
      supabase.from("oncall_records").delete().neq("id", dummyFilterId),
      supabase.from("treatment_records").delete().neq("id", dummyFilterId),
      supabase.from("product_orders").delete().neq("id", dummyFilterId),
    ]);

    console.log("Selesai! Data lama telah dibersihkan.");
    return { status: "success", etherealUrl, message: "Pengarkiban Selesai" };

  } catch (err) {
    console.error("Ralat ketika proses pengarkiban:", err);
    throw err;
  }
}

module.exports = { runAnnualArchive };
