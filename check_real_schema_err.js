const supabase = require('./config/db');

async function test() {
    let { data: b, error } = await supabase.from('booking_records').select('*').limit(1);
    console.log("booking_records error:", error);
    console.log("booking_records data:", b);
}
test();
