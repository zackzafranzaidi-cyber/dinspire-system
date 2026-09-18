const supabase = require("./config/db");
async function checkSchema() {
  const { data, error } = await supabase.from("product_orders").select("*").limit(1);
  console.log(data);
}
checkSchema();
