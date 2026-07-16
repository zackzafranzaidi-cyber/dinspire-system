const express = require("express");
const router = express.Router();
const supabase = require("../config/db");
const { authenticate, requireRole } = require("../middleware/auth");
const cache = require("../utils/cache");

function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str).replace(/[&<>'"]/g, function (tag) {
    const charsToReplace = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return charsToReplace[tag] || tag;
  });
}
function isValidImageBuffer(buffer) {
  const hex = buffer.toString("hex", 0, 4).toUpperCase();
  if (hex.startsWith("FFD8FF")) return "jpg";
  if (hex === "89504E47") return "png";
  if (hex.startsWith("47494638")) return "gif";
  if (
    hex.startsWith("52494646") &&
    buffer.toString("hex", 8, 12).toUpperCase() === "57454250"
  )
    return "webp";
  // Amaran: Ini hanyalah semakan tandatangan asas.
  // Dalam persekitaran berskala besar, gunakan modul seperti 'file-type' dan virus scanner.
  return null;
}

// [DIBAIKI] Fungsi Upload Keselamatan Tinggi (Anti-Malware)
async function uploadToStorage(base64Image, folder, namePrefix) {
  if (!base64Image || !base64Image.startsWith("data:image")) return base64Image;
  try {
    const matches = base64Image.match(
      /^data:image\/([A-Za-z-+\/]+);base64,(.+)$/,
    );
    if (!matches || matches.length !== 3) return base64Image;

    const buffer = Buffer.from(matches[2], "base64");

    // Memeriksa fail tulen melalui kod binari (Bukan sekadar semak nama)
    const realExtension = isValidImageBuffer(buffer);
    if (!realExtension) {
      console.error(
        "Keselamatan Sistem: Cubaan memuat naik fail berbahaya/skrip disekat!",
      );
      return null; // Tolak fail secara automatik
    }

    const fileName = `${folder}/${namePrefix}_${Date.now()}.${realExtension}`;

    const { error } = await supabase.storage
      .from("shop_images")
      .upload(fileName, buffer, {
        contentType: `image/${realExtension}`,
        upsert: true,
      });

    if (error) {
      console.error("Storage Error:", error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from("shop_images")
      .getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("Ralat Muat Naik Admin:", err.message);
    return null;
  }
}

// ----------------------------------------------------
// AMBIL DATA DARI SUPABASE (GET)
// ----------------------------------------------------
router.get(
  "/data",
  authenticate,
  requireRole(["admin", "owner"]),
  async (req, res) => {
    try {
      const cachedData = cache.get("admin_data");
      if (cachedData) {
        console.log("[CACHE HIT] admin_data");
        return res.json(cachedData);
      }

      const [
        { data: hcData },
        { data: trData },
        { data: brData },
        { data: stData },
        { data: prData },
        { data: setAll },
      ] = await Promise.all([
        supabase.from("haircuts").select("*"),
        supabase.from("treatments").select("*"),
        supabase.from("branches").select("*"),
        supabase.from("staff").select("*"),
        supabase.from("products").select("*"),
        supabase.from("settings").select("*"),
      ]);

      let posters = [];
      let settings = { shipping_fee: 0, service_fee: 0, peratus_komisen: 50 };

      (setAll || []).forEach((s) => {
        if (s.setting_key === "posters") {
          try {
            posters = JSON.parse(s.setting_value);
          } catch (e) {}
        } else if (s.setting_key === "shipping_fee") {
          settings.shipping_fee = parseFloat(s.setting_value) || 0;
        } else if (s.setting_key === "service_fee") {
          settings.service_fee = parseFloat(s.setting_value) || 0;
        } else if (s.setting_key === "peratus_komisen") {
          settings.peratus_komisen = parseFloat(s.setting_value) || 50;
        }
      });

      const result = {
        status: "success",
        data: {
          Haircuts: (hcData || [])
            .filter((h) => h.kategori === "Booking")
            .map((h) => ({
              id: h.id,
              name: h.nama_potongan,
              desc: escapeHTML(h.diskripsi),
              price: h.harga,
            })),
          Treatments: (trData || []).map((t) => ({
            id: t.id,
            name: t.nama_rawatan,
            desc: t.diskripsi,
            price: t.harga,
          })),
          WalkInServices: (hcData || [])
            .filter((h) => h.kategori === "Walk-in")
            .map((h) => ({ id: h.id, name: h.nama_potongan, price: h.harga })),
          OnCall: (hcData || [])
            .filter((h) => h.kategori === "On-Call")
            .map((h) => ({ id: h.id, name: h.nama_potongan, price: h.harga })),
          Branches: (brData || []).map((b) => ({
            id: b.id,
            name: b.nama_cawangan,
            location: b.lokasi,
          })),
          Barbers: (stData || [])
            .filter((s) => s.jenis_staf === "In-Branch")
            .map((s) => ({
              id: s.id,
              name: s.username,
              branch_id: s.branch_id,
            })),
          OnCallBarbers: (stData || [])
            .filter((s) => s.jenis_staf === "On-Call")
            .map((s) => ({ id: s.id, name: s.username })),
          Products: (prData || []).map((p) => ({
            id: p.id,
            name: p.nama,
            price: p.harga,
            imageUrl: p.gambar,
          })),
          Posters: posters,
          Settings: settings,
        },
      };

      cache.set("admin_data", result, 300); // Set cache selama 5 minit
      res.json(result);
    } catch (error) {
      res
        .status(500)
        .json({ status: "error", message: "Gagal memuat turun data." });
    }
  },
);

// ----------------------------------------------------
// SIMPAN DATA KE SUPABASE (POST)
// ----------------------------------------------------
router.post(
  "/save",
  authenticate,
  requireRole(["admin", "owner"]),
  async (req, res) => {
    const { data } = req.body;
    try {
      const syncData = async (table, items, mapFn) => {
        if (!items) return;

        // 1. Petakan data daripada frontend ke format pangkalan data
        const mappedItems = items.map(mapFn);

        // 2. Ambil semua ID yang aktif dihantar dari frontend
        const currentIds = mappedItems
          .map((item) => item.id)
          .filter((id) => id);

        try {
          // 3. KENDALIKAN PEMADAMAN SECARA SELAMAT (Targeted Delete)
          // Bukannya memadam semua rekod, kita HANYA padam rekod lama yang TIADA dalam senarai baru frontend
          if (currentIds.length > 0) {
            // Gunakan Array terus ke dalam fungsi 'in' Supabase untuk elak isu sintaks/SQL Injection
            const { error: delErr } = await supabase
              .from(table)
              .delete()
              .not("id", "in", currentIds);

            if (delErr) throw delErr;
          } else {
            // Jika admin memang sengaja memadam KESEMUA baris pada jadual tersebut di UI
            const { error: delAllErr } = await supabase
              .from(table)
              .delete()
              .neq("id", "00000000-0000-0000-0000-000000000000"); // ID dummy/all safe check

            if (delAllErr) throw delAllErr;
          }

          // 4. KENDALIKAN PENYIMPANAN PINTAR (UPSERT)
          // Mengemas kini (Update) jika ID sudah wujud, atau menambah (Insert) jika ia rekod baru
          if (mappedItems.length > 0) {
            const { error: upsertErr } = await supabase
              .from(table)
              .upsert(mappedItems, { onConflict: "id" });

            if (upsertErr) throw upsertErr;
          }
        } catch (err) {
          console.error(`Ralat semasa menyelaraskan jadual ${table}:`, err);
          throw err; // Lemparkan ralat ke blok catch utama router untuk rollback/respons ralat
        }
      };

      await syncData(
        "haircuts",
        [
          ...(data.Haircuts || []).map((x) => ({ ...x, kategori: "Booking" })),
          ...(data.WalkInServices || []).map((x) => ({
            ...x,
            kategori: "Walk-in",
          })),
          ...(data.OnCall || []).map((x) => ({ ...x, kategori: "On-Call" })),
        ],
        (i) => ({
          id: i.id,
          nama_potongan: i.name,
          diskripsi: i.desc || "-",
          harga: i.price,
          kategori: i.kategori,
        }),
      );
      await syncData("treatments", data.Treatments, (i) => ({
        id: i.id,
        nama_rawatan: i.name,
        diskripsi: i.desc || "-",
        harga: i.price,
      }));
      await syncData("branches", data.Branches, (i) => ({
        id: i.id,
        nama_cawangan: i.name,
        lokasi: i.location,
      }));
      await syncData(
        "staff",
        [
          ...(data.Barbers || []).map((x) => ({
            ...x,
            jenis_staf: "In-Branch",
          })),
          ...(data.OnCallBarbers || []).map((x) => ({
            ...x,
            jenis_staf: "On-Call",
          })),
        ],
        (i) => ({
          id: i.id,
          username: i.name,
          jenis_staf: i.jenis_staf,
          branch_id: i.branch_id || null,
        }),
      );

      // ==========================================
      // [DIBAIKI] Semakan Imej Produk
      // ==========================================
      if (data.Products) {
        let processedProducts = [];
        for (let i = 0; i < data.Products.length; i++) {
          let p = data.Products[i];
          let url = p.imageUrl;
          if (url && url.startsWith("data:image")) {
            let uploaded = await uploadToStorage(url, "products", `prod_${i}`);
            if (!uploaded)
              throw new Error(
                "Gagal upload gambar produk. Pastikan bucket 'shop_images' wujud dan berstatus Public.",
              );
            url = uploaded;
          }
          processedProducts.push({ ...p, imageUrl: url });
        }
        
        await syncData("products", processedProducts, (i) => ({
          id: i.id, nama: i.name, harga: i.price, gambar: i.imageUrl
        }));
      }

      // ==========================================
      // [DIBAIKI] Semakan Imej Poster
      // ==========================================
      if (data.Posters) {
        let finalPosters = [];
        for (let i = 0; i < data.Posters.length; i++) {
          let p = data.Posters[i];
          let finalUrl = p.imageUrl;
          if (finalUrl && finalUrl.startsWith("data:image")) {
            let uploaded = await uploadToStorage(
              finalUrl,
              "posters",
              `promo_${i}`,
            );
            if (!uploaded)
              throw new Error(
                "Gagal upload poster. Pastikan bucket 'shop_images' wujud dan berstatus Public.",
              );
            finalUrl = uploaded;
          }
          finalPosters.push({ id: p.id, imageUrl: finalUrl });
        }

        const stringData = JSON.stringify(finalPosters);
        const { data: chk } = await supabase
          .from("settings")
          .select("setting_key")
          .eq("setting_key", "posters");

        if (chk && chk.length > 0) {
          const { error: updErr } = await supabase
            .from("settings")
            .update({ setting_value: stringData })
            .eq("setting_key", "posters");
          if (updErr) throw updErr;
        } else {
          const { error: insErr } = await supabase
            .from("settings")
            .insert([{ setting_key: "posters", setting_value: stringData }]);
          if (insErr) throw insErr;
        }
      }

      // SIMPAN FEE KE JADUAL SETTINGS
      if (data.Settings) {
        const settingKeys = [
          { key: "shipping_fee", val: Math.max(0, parseFloat(data.Settings.shipping_fee) || 0) },
          { key: "service_fee", val: Math.max(0, parseFloat(data.Settings.service_fee) || 0) },
          { key: "peratus_komisen", val: Math.max(0, parseFloat(data.Settings.peratus_komisen) || 0) },
        ];

        for (let s of settingKeys) {
          if (s.val !== undefined && s.val !== null) {
            const { data: chk } = await supabase
              .from("settings")
              .select("setting_key")
              .eq("setting_key", s.key);
            if (chk && chk.length > 0) {
              const { error: updErr } = await supabase
                .from("settings")
                .update({ setting_value: String(s.val) })
                .eq("setting_key", s.key);
              if (updErr) throw updErr;
            } else {
              const { error: insErr } = await supabase
                .from("settings")
                .insert([{ setting_key: s.key, setting_value: String(s.val) }]);
              if (insErr) throw insErr;
            }
          }
        }
      }

      // Padam cache lama supaya pengguna/admin terus dapat data baru
      cache.del("shop_data");
      cache.del("admin_data");

      res.json({
        status: "success",
        message: "Data berjaya disimpan ke Cloud!",
      });
    } catch (error) {
      console.error("Ralat Menyimpan Admin CMS:", error);
      // Menghantar mesej ralat yang tepat kepada UI Admin
      res
        .status(500)
        .json({
          status: "error",
          message: "Ralat menyimpan pangkalan data. Sila cuba sebentar lagi.",
        });
    }
  },
);

module.exports = router;
