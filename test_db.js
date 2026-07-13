const supabase = require('./config/db');

async function test() {
    const { data: p } = await supabase.from('product_orders').select('*').limit(2);
    console.log("Product Orders:", JSON.stringify(p, null, 2));
}
test();
