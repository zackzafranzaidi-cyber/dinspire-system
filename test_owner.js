const supabase = require('./config/db');
async function testOwnerDashboard() {
  console.log("Testing dashboard API logic...");
  try {
        const [resJualan, resStaf, resReview, resStafTotal] = await Promise.all([
          supabase.from("booking_records").select("harga_rm, service_fee").in("status", ["Selesai"]),
          supabase.from("walkin_records").select("harga_rm, service_fee"),
          supabase.from("reviews").select("rating, komen"),
          supabase.from("staff").select("id, username", { count: "exact" }),
        ]);
        console.log("Jualan:", resJualan.data ? resJualan.data.length : resJualan.error);
        console.log("Walkin:", resWalkin ? resWalkin.data.length : resWalkin.error); // Wait, resWalkin is resStaf!!
  } catch(e) {
      console.log(e);
  }
}
testOwnerDashboard();
