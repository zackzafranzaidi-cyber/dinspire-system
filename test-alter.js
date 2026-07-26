require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const { Client } = require("pg");

// We can use pg client to execute ALTER TABLE on the local Supabase instance
const pgClient = new Client({
  connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres" // default local supabase connection
});

async function run() {
  try {
    await pgClient.connect();
    
    // Add customer_id to tables
    await pgClient.query("ALTER TABLE booking_records ADD COLUMN IF NOT EXISTS customer_id uuid;");
    await pgClient.query("ALTER TABLE treatment_records ADD COLUMN IF NOT EXISTS customer_id uuid;");
    await pgClient.query("ALTER TABLE oncall_records ADD COLUMN IF NOT EXISTS customer_id uuid;");
    await pgClient.query("ALTER TABLE product_orders ADD COLUMN IF NOT EXISTS customer_id uuid;");
    
    console.log("SUCCESS");
  } catch (err) {
    console.error("ERROR:", err.message);
  } finally {
    await pgClient.end();
  }
}
run();
