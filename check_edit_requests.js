const supabase = require('./config/db');

async function test() {
    let { data, error } = await supabase.from('edit_requests').select('transaction_id').limit(1);
    console.log("data:", data, "error:", error);
}
test();
