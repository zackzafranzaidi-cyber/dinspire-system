require("dotenv").config({ path: "C:\\Users\\USER\\din-barbershop-backend\\.env" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function test() {
  const { data: trt } = await supabase.from("treatments").select("id").limit(1).single();
  const { data: stf } = await supabase.from("staff").select("id").limit(1).single();
  
  const { error } = await supabase.from("walkin_records").insert([
    {
      nama_pelanggan: "Test",
      no_phone: "-",
      tarikh: new Date().toISOString().split("T")[0],
      masa: "12:00",
      jenis_potongan: trt.id,
      staff_id: stf.id,
      harga_rm: 10,
      service_fee: 0,
      jenis_bayaran: "Cash",
      resit: "http://none"
    }
  ]);
  
  console.log("ERROR IS:", error);
}
test();
