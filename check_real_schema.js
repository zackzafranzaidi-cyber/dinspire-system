const supabase = require('./config/db');

async function test() {
    let { data: b } = await supabase.from('booking_records').select('*').limit(1);
    console.log("booking_records:", Object.keys(b[0] || {}));
    
    let { data: w } = await supabase.from('walkin_records').select('*').limit(1);
    console.log("walkin_records:", Object.keys(w[0] || {}));
}
test();
