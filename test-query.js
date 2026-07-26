require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function test() {
  const { data, error } = await supabase
    .from("booking_records")
    .select("*");
  console.log("BOOKINGS:", data);
  console.log("ERROR:", error);
}
test();
