const fs = require('fs');
let js = fs.readFileSync('routes/bookings.js', 'utf8');

const regex = /try\s*\{\s*const \{\s*error\s*\} = await supabase\.from\("walkin_records"\)\.insert\(\[/;
const spamCheckLogic = `try {
        // [DIBAIKI] Elak Spam / Duplicate Walkin (Offline Sync / Click Spam)
        // Semak jika ada rekod yang SAMA TEPAT dalam masa 2 minit lepas
        const duaMinitLepas = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        const { data: dupData } = await supabase.from("walkin_records")
           .select("id")
           .eq("nama_pelanggan", customer_name)
           .eq("no_phone", no_phone || "-")
           .eq("jenis_potongan", service_id)
           .eq("staff_id", staff_id)
           .gte("created_at", duaMinitLepas)
           .maybeSingle();
           
        if (dupData) {
           // Jika wujud, return success supaya frontend clear queue tanpa insert 2 kali
           return res.json({ status: "success", message: "Rekod Walk-In berjaya disimpan." });
        }

        const { error } = await supabase.from("walkin_records").insert([`;

if (regex.test(js)) {
    js = js.replace(regex, spamCheckLogic);
    fs.writeFileSync('routes/bookings.js', js);
    console.log("Regex replaced.");
} else {
    console.log("Regex not found.");
}
