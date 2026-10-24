const supabase = require("../config/db");

/**
 * Semak sama ada sesuatu entiti terikat dengan transaksi atau data lain.
 * @param {string} table - Nama jadual ("staff", "haircuts", "treatments", "branches", "products")
 * @param {string} id - ID rekod
 * @param {object} extraData - Data tambahan rekod (contoh: nama_cawangan)
 * @returns {Promise<boolean>} - true jika terikat, false jika bebas
 */
async function isEntityReferenced(table, id, extraData = {}, dbClient = null) {
  if (!id) return false;
  const db = dbClient || supabase;

  try {
    if (table === "staff") {
      const [b, w, t, o, p, l, e] = await Promise.all([
        db.from("booking_records").select("no_booking", { count: "exact", head: true }).eq("staff_id", id),
        db.from("walkin_records").select("id", { count: "exact", head: true }).eq("staff_id", id),
        db.from("treatment_records").select("no_booking", { count: "exact", head: true }).eq("staff_id", id),
        db.from("oncall_records").select("no_booking", { count: "exact", head: true }).eq("staff_id", id),
        db.from("punch_cards").select("id", { count: "exact", head: true }).eq("staff_id", id),
        db.from("staff_leaves").select("id", { count: "exact", head: true }).eq("staff_id", id),
        db.from("edit_requests").select("id", { count: "exact", head: true }).eq("staff_id", id),
      ]);
      const total =
        (b.count || 0) +
        (w.count || 0) +
        (t.count || 0) +
        (o.count || 0) +
        (p.count || 0) +
        (l.count || 0) +
        (e.count || 0);
      return total > 0;
    }

    if (table === "haircuts") {
      const [b, w, o] = await Promise.all([
        db.from("booking_records").select("no_booking", { count: "exact", head: true }).eq("jenis_haircut", id),
        db.from("walkin_records").select("id", { count: "exact", head: true }).eq("jenis_potongan", id),
        db.from("oncall_records").select("no_booking", { count: "exact", head: true }).eq("jenis_haircut", id),
      ]);
      const total = (b.count || 0) + (w.count || 0) + (o.count || 0);
      return total > 0;
    }

    if (table === "treatments") {
      const { count } = await db
        .from("treatment_records")
        .select("no_booking", { count: "exact", head: true })
        .eq("jenis_rawatan", id);
      return (count || 0) > 0;
    }

    if (table === "branches") {
      const { count: staffCount } = await db
        .from("staff")
        .select("id", { count: "exact", head: true })
        .eq("branch_id", id);
      let punchCount = 0;
      if (extraData && extraData.nama_cawangan) {
        const { count } = await db
          .from("punch_cards")
          .select("id", { count: "exact", head: true })
          .eq("cawangan", extraData.nama_cawangan);
        punchCount = count || 0;
      }
      return (staffCount || 0) + punchCount > 0;
    }

    if (table === "products") {
      const { data: orders } = await db
        .from("product_orders")
        .select("senarai_produk")
        .limit(1000);
      if (orders && orders.length > 0) {
        for (const ord of orders) {
          if (!ord.senarai_produk) continue;
          let items = ord.senarai_produk;
          if (typeof items === "string") {
            try {
              items = JSON.parse(items);
            } catch (err) {
              items = {};
            }
          }
          if (
            items &&
            (items[id] || (Array.isArray(items) && items.some((i) => i.id === id)))
          ) {
            return true;
          }
        }
      }
      return false;
    }

    return false;
  } catch (err) {
    console.error(`[SMART DELETE] Ralat menyemak rujukan jadual ${table}:`, err.message);
    // Keselamatan data: Jika ralat berlaku, anggap terikat untuk elak pemadaman tidak sengaja
    return true;
  }
}

/**
 * Pembersihan Pintar Automatik bagi rekod-rekod yang telah dinyahaktifkan (is_active = false)
 * dan sudah tidak mempunyai sebarang ikatan transaksi (contoh: selepas pemotongan data tahunan).
 * @param {object} [dbClient=null] - Pilihan klien pangkalan data (default: supabase)
 * @returns {Promise<object>} - Ringkasan rekod yang dipadamkan
 */
async function purgeOrphanedInactiveRecords(dbClient = null) {
  const db = dbClient || supabase;
  console.log("[SMART PURGE] Memulakan semakan pembersihan rekod dinyahaktifkan...");
  const tables = ["staff", "haircuts", "treatments", "products", "branches"];
  const summary = {};

  for (const table of tables) {
    summary[table] = 0;
    try {
      const { data: inactiveRows, error } = await db
        .from(table)
        .select("*")
        .eq("is_active", false);

      if (error) {
        // Jika lajur is_active belum wujud, langkau
        if (error.code !== "42703") {
          console.error(`[SMART PURGE] Ralat membaca ${table}:`, error.message);
        }
        continue;
      }

      if (!inactiveRows || inactiveRows.length === 0) continue;

      for (const item of inactiveRows) {
        const isRef = await isEntityReferenced(table, item.id, item, db);
        if (!isRef) {
          console.log(`[SMART PURGE] Memadam ${table} ID ${item.id} secara kekal kerana tiada rekod transaksi terikat.`);
          const { error: delErr } = await db.from(table).delete().eq("id", item.id);
          if (!delErr) {
            summary[table]++;
          } else {
            console.error(`[SMART PURGE] Gagal memadam ${table} ID ${item.id}:`, delErr.message);
          }
        }
      }
    } catch (err) {
      console.error(`[SMART PURGE] Ralat memproses ${table}:`, err.message);
    }
  }

  console.log("[SMART PURGE] Ringkasan pembersihan:", summary);
  return summary;
}

module.exports = {
  isEntityReferenced,
  purgeOrphanedInactiveRecords,
};
