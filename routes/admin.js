const express = require("express");
const router = express.Router();
const supabase = require("../config/db");
const { authenticate, requireRole } = require("../middleware/auth");
const cache = require("../utils/cache");
const bcrypt = require("bcryptjs");

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

// [DIBAIKI] Fungsi Upload Keselamatan Tinggi (Anti-Malware & Regex DoS)
async function uploadToStorage(base64Image, folder, namePrefix) {
  if (!base64Image || !base64Image.startsWith("data:image")) return base64Image;
  
  // [DIBAIKI] Pembekuan Teras Pemproses (Regex DoS)
  if (base64Image.length > 5000000) {
    console.error("Fail terlalu besar (Melebihi 5MB).");
    return null;
  }

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
        { data: genData },
      ] = await Promise.all([
        supabase.from("haircuts").select("*"),
        supabase.from("treatments").select("*"),
        supabase.from("branches").select("*"),
        supabase.from("staff").select("*"),
        supabase.from("products").select("*"),
        supabase.from("settings").select("*"),
        supabase.from("general_staff").select("*"),
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
            lat: b.lat,
            lng: b.lng,
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
          GeneralStaff: (genData || []).map((s) => ({
            id: s.id,
            name: s.username,
          })),
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

        // [DIBAIKI] Mass Array Exhaustion (Admin DoS)
        const safeItems = items.slice(0, 500);

        // 1. Petakan data daripada frontend ke format pangkalan data
        const mappedItems = safeItems.map((item) => {
          const mapped = mapFn(item);
          // Padamkan medan 'id' jika ia kosong (string kosong) supaya Postgres boleh auto-generate UUID
          if (mapped.id === "" || mapped.id === null || mapped.id === undefined) {
            delete mapped.id;
          }
          return mapped;
        });

        // 2. Ambil semua ID yang aktif dihantar dari frontend
        const currentIds = mappedItems
          .map((item) => item.id)
          .filter((id) => id);

        try {
          // 3. KENDALIKAN PEMADAMAN SECARA SELAMAT (Targeted Delete)
          // Bukannya memadam semua rekod, kita HANYA padam rekod lama yang TIADA dalam senarai baru frontend
          if (currentIds.length > 0) {
            // Gunakan format string dengan kurungan untuk not.in bagi mematuhi sintaks PostgREST
            const { error: delErr } = await supabase
              .from(table)
              .delete()
              .not("id", "in", "(" + currentIds.join(",") + ")");

            if (delErr) throw delErr;
          } else {
            // Jika admin memang sengaja memadam KESEMUA baris pada jadual tersebut di UI
            const { error: delAllErr } = await supabase
              .from(table)
              .delete()
              .neq("id", "00000000-0000-0000-0000-000000000000"); // ID dummy/all safe check

            if (delAllErr) throw delAllErr;
          }

          // 4. KENDALIKAN PENYIMPANAN PINTAR (Insert vs Update)
          if (mappedItems.length > 0) {
            const { data: existingData, error: fetchErr } = await supabase
              .from(table)
              .select("id")
              .in("id", currentIds);
            if (fetchErr) throw fetchErr;

            const existingIds = existingData.map((d) => d.id);
            const itemsToUpdate = mappedItems.filter((item) => existingIds.includes(item.id));
            const itemsToInsert = mappedItems.filter((item) => !existingIds.includes(item.id));

            // 4a. Tambah Rekod Baru
            if (itemsToInsert.length > 0) {
              if (table === "staff" || table === "general_staff") {
                const defaultHash = await bcrypt.hash("123123", 10);
                itemsToInsert.forEach((i) => {
                  i.password_hash = defaultHash;
                  i.must_change_password = true;
                  i.reset_requested = false;
                });
              }
              const { error: insErr } = await supabase.from(table).insert(itemsToInsert);
              if (insErr) throw insErr;
            }

            // 4b. Kemas Kini Rekod Sedia Ada
            if (itemsToUpdate.length > 0) {
              const updatePromises = itemsToUpdate.map((item) =>
                supabase.from(table).update(item).eq("id", item.id)
              );
              const results = await Promise.all(updatePromises);
              for (let r of results) {
                if (r.error) throw r.error;
              }
            }
          }
        } catch (err) {
          console.error(`Ralat semasa menyelaraskan jadual ${table}:`, err);
          if (err.code === "23503") {
            throw new Error(
              `Tidak boleh memadam data dalam jadual '${table}' kerana ia sedang digunakan oleh rekod lain (contoh: Tempahan pelanggan atau resit). Sila pastikan rekod ini tidak terikat sebelum memadamnya.`
            );
          }
          if (err.code === "22P02" && String(err.message).includes("uuid")) {
            throw new Error(
              `Terdapat penambahan rekod baharu dengan format ID yang tidak sah pada jadual '${table}'. Sila pastikan anda mengakses portal ini menggunakan sambungan selamat (HTTPS) atau pelayar web yang moden.`
            );
          }
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
            harga: Math.max(0, parseFloat(i.price) || 0), // [DIBAIKI] Negative Pricing Fix
            kategori: i.kategori,
          }),
      );
      await syncData("treatments", data.Treatments, (i) => ({
        id: i.id,
        nama_rawatan: i.name,
        diskripsi: i.desc || "-",
        harga: Math.max(0, parseFloat(i.price) || 0), // [DIBAIKI] Negative Pricing Fix
      }));
      await syncData("branches", data.Branches, (i) => ({
        id: i.id,
        nama_cawangan: i.name,
        lokasi: i.location,
        lat: parseFloat(i.lat) || null,
        lng: parseFloat(i.lng) || null,
      }));
      await syncData("general_staff", data.GeneralStaff, (i) => ({
        id: i.id,
        username: i.name,
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
        const safeProducts = data.Products.slice(0, 500); // [DIBAIKI] Mass Array Exhaustion limit for loops
        for (let i = 0; i < safeProducts.length; i++) {
          let p = safeProducts[i];
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
          id: i.id, nama: i.name, harga: Math.max(0, parseFloat(i.price) || 0), gambar: i.imageUrl
        }));
      }

      // ==========================================
      // [DIBAIKI] Semakan Imej Poster
      // ==========================================
      if (data.Posters) {
        let finalPosters = [];
        const safePosters = data.Posters.slice(0, 50); // Maksimum 50 poster
        for (let i = 0; i < safePosters.length; i++) {
          let p = safePosters[i];
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
      
      let errorMsg = "Ralat menyimpan pangkalan data. Sila cuba sebentar lagi.";
      if (error.message && (error.message.includes("Tidak boleh memadam data") || error.message.includes("format ID yang tidak sah"))) {
        errorMsg = error.message;
      }
      
      // Menghantar mesej ralat yang tepat kepada UI Admin
      res
        .status(500)
        .json({
          status: "error",
          message: errorMsg,
        });
    }
  },
);

// GET - Senarai staf yang meminta reset kata laluan
router.get("/staff/reset-requests", authenticate, requireRole(["admin", "owner"]), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("staff")
      .select("id, username, jenis_staf, branch_id")
      .eq("reset_requested", true);
    if (error) throw error;
    res.json({ status: "success", data: data || [] });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Gagal mendapatkan senarai permohonan reset." });
  }
});

router.put("/staff/:id/approve-reset", authenticate, requireRole(["admin", "owner"]), async (req, res) => {

  try {
    const { data: staff } = await supabase.from("staff").select("reset_requested").eq("id", req.params.id).single();
    if (!staff || !staff.reset_requested) {
      return res.status(400).json({ status: "error", message: "Tiada permohonan reset untuk staf ini." });
    }
    
    // Reset password back to 123123
    const password_hash = await bcrypt.hash("123123", 10);
    const { error } = await supabase.from("staff").update({
      password_hash,
      must_change_password: true,
      reset_requested: false
    }).eq("id", req.params.id);
    
    if (error) throw error;
    res.json({ status: "success", message: "Kata laluan staf di-reset kepada 123123." });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Ralat sistem kelulusan reset." });
  }
});

module.exports = router;
