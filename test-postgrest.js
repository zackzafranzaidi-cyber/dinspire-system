require('dotenv').config();
const supabase = require('./config/db');

async function testPostgREST() {
  console.log("Menguji sambungan ke jadual 'general_staff' melalui API...");
  const { data, error } = await supabase.from('general_staff').select('*').limit(1);
  if (error) {
    console.error("Ralat PostgREST:", error);
  } else {
    console.log("✅ Berjaya! Jadual general_staff boleh diakses.");
  }
}

testPostgREST();
