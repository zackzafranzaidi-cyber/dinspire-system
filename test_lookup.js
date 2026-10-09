const supabase = require('./config/db');

async function testLookup() {
    const phone = "0123456789";
    const formatPhone = (phone) => {
      let p = String(phone).replace(/\D/g, "");
      if (p.startsWith("0")) p = "6" + p;
      else if (p.startsWith("+60")) p = p.substring(1);
      else if (!p.startsWith("60")) p = "60" + p;
      return p;
    };
    const formatted = formatPhone(phone);
    console.log("Formatted:", formatted);
    
    // 1. Check directory
    const { data: dData, error: dErr } = await supabase.from("customer_directory").select("real_name").eq("phone_number", formatted).maybeSingle();
    console.log("Directory:", dData, dErr);
    
    // 2. Check customers
    const { data: cData, error: cErr } = await supabase.from("customers").select("name").eq("phone", phone).maybeSingle();
    console.log("Customers:", cData, cErr);
    
    // 3. Check walkin
    const { data: wData, error: wErr } = await supabase.from("walkin_records").select("nama_pelanggan").eq("no_phone", phone).order('created_at', {ascending: false}).limit(1).maybeSingle();
    console.log("Walkin:", wData, wErr);
}
testLookup();
