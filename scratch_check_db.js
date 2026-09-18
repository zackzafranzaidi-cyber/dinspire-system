const supabase = require("./config/db");
async function checkDB() {
  const { data } = await supabase.from("customers").select("phone").limit(5);
  console.log("Customers phone format:", data);
}
checkDB();
