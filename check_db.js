const supabase = require('./config/db');

async function checkDB() {
    // 1. check customer_directory
    const { data: dData } = await supabase.from("customer_directory").select("*").limit(5);
    console.log("Directory Sample:", dData);
    
    // 2. check walkin_records for 0123456789
    const { data: wData } = await supabase.from("walkin_records").select("no_phone, nama_pelanggan").eq("no_phone", "0123456789");
    console.log("Walkin matches for 0123456789:", wData);
    
    // 3. check walkin_records generally
    const { data: wAll } = await supabase.from("walkin_records").select("no_phone, nama_pelanggan").limit(5);
    console.log("Walkin Sample:", wAll);
}
checkDB();
