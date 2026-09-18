const supabase = require("./config/db");
async function checkDB() {
  const { data, error } = await supabase.from("customers").select("phone").limit(5);
  console.log("Customers phone format:", data);
  if (error) console.log("Error:", error);
}
checkDB();
