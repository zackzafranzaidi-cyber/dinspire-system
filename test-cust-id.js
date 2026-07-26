require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function test() {
  const customer_id = "efe86c16-d3f7-4d45-ae49-16f9be89243d";
  const { data, error } = await supabase
    .from("customers")
    .select("name, phone, email")
    .eq("id", customer_id)
    .single();
  console.log("DATA:", data);
  console.log("ERROR:", error);
}
test();
