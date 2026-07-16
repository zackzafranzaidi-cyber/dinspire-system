const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// [DIBAIKI] Fail-Fast: Matikan sistem jika tiada kunci pangkalan data
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error("FATAL ERROR: Kunci Supabase tidak dijumpai. Sistem tidak dapat beroperasi (Silent DB Failure Prevention).");
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = supabase;