const supabase = require('./config/db');

async function test() {
    let { data, error } = await supabase.from('bookings').select('*').limit(1);
    console.log("bookings:", Object.keys(data[0] || {}));
    
    let { data: w, error: we } = await supabase.from('walkins').select('*').limit(1);
    console.log("walkins:", Object.keys(w[0] || {}));
    
    let { data: t, error: te } = await supabase.from('treatments').select('*').limit(1);
    console.log("treatments:", Object.keys(t[0] || {}));
    
    let { data: o, error: oe } = await supabase.from('oncalls').select('*').limit(1);
    console.log("oncalls:", Object.keys(o[0] || {}));
}
test();
