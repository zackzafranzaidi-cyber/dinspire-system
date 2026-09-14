const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
  try {
    const [
      { data: hcData, error: e1 },
      { data: trData, error: e2 },
      { data: brData, error: e3 },
      { data: stData, error: e4 },
      { data: prData, error: e5 },
      { data: setAll, error: e6 },
    ] = await Promise.all([
      supabase.from("haircuts").select("*"),
      supabase.from("treatments").select("*"),
      supabase.from("branches").select("*"),
      supabase.from("staff").select("id, username, jenis_staf, branch_id, can_haircut, can_treatment, must_change_password"),
      supabase.from("products").select("*"),
      supabase.from("settings").select("*"),
    ]);

    if (e1) throw e1;
    if (e2) throw e2;
    if (e3) throw e3;
    if (e4) throw e4;
    if (e5) throw e5;
    if (e6) throw e6;

    console.log("Supabase fetch successful.");

    // Now map it exactly like admin.js
    function escapeHTML(str) {
      if (str === null || str === undefined) return "";
      return String(str).replace(/[&<>'"]/g, function (tag) {
        const charsToReplace = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" };
        return charsToReplace[tag] || tag;
      });
    }

    let posters = [];
    let settings = { shipping_fee: 0, service_fee: 0, peratus_komisen: 50, gaji_asas: 1800 };

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
        }
    };
    console.log("Mapping successful!");
  } catch (err) {
    console.error("ERROR CAUGHT:", err);
  }
}
testFetch();
