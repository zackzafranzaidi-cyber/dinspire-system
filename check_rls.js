const supabase = require('./config/db');
async function checkRLS() {
    const { data, error } = await supabase.from('customer_directory').select('*').limit(1);
    console.log("Directory data:", data, "Error:", error);
}
checkRLS();
