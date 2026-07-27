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
    
    // Add no_booking to product_orders
    await pgClient.query("ALTER TABLE product_orders ADD COLUMN IF NOT EXISTS no_booking TEXT;");
    
    console.log("SUCCESS");
  } catch (err) {
    console.error("ERROR:", err.message);
  } finally {
    await pgClient.end();
  }
}
run();
