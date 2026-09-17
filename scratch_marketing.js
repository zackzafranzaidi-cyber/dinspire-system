const fs = require('fs');

let js = fs.readFileSync('routes/owner.js', 'utf8');

const regex = /\/marketing-customers"[\s\S]*?res\.json\(Array\.from\(uniqueCustomers\.values\(\)\)\);\s*\}\s*catch\s*\(err\)\s*\{\s*console\.error\("Marketing API Error:",\s*err\);\s*res\.status\(500\)\.json\(\{\s*error:\s*"Ralat pelayan: "\s*\+\s*err\.message\s*\}\);\s*\}\s*\}/;

const newBlock = `/marketing-customers",
    authenticate,
    requireRole(["owner"]),
    async (req, res) => {
      try {
        const [resCustomers, resWalkins] = await Promise.all([
          supabase.from("customers").select("name, phone, created_at").order("created_at", { ascending: false }).limit(5000),
          supabase.from("walkin_records").select("nama_pelanggan, no_phone, created_at").not("no_phone", "is", null).order("created_at", { ascending: false }).limit(5000)
        ]);
        
        const customers = resCustomers.data || [];
        const walkins = resWalkins.data || [];
        
        const uniqueCustomers = new Map();
        
        const formatPhone = (phone) => {
          let p = String(phone).replace(/\\D/g, "");
          if (p.startsWith("0")) p = "6" + p;
          else if (p.startsWith("+60")) p = p.substring(1);
          else if (!p.startsWith("60")) p = "60" + p;
          return p;
        };

        let allRecords = [];
        
        walkins.forEach(w => {
           if (w.no_phone) {
              const p = formatPhone(w.no_phone);
              if (p.length > 5) {
                  allRecords.push({ phone: p, name: w.nama_pelanggan || "Walk-In", source: "Walk-In", created_at: w.created_at || "1970-01-01" });
              }
           }
        });

        customers.forEach(c => {
           if (c.phone) {
              const p = formatPhone(c.phone);
              if (p.length > 5) {
                  allRecords.push({ phone: p, name: c.name || "Pelanggan Dinspire", source: "Berdaftar", created_at: c.created_at || "1970-01-01" });
              }
           }
        });

        allRecords.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        allRecords.forEach(record => {
           if (uniqueCustomers.has(record.phone)) {
              if (record.source === "Berdaftar" && uniqueCustomers.get(record.phone).source === "Walk-In") {
                 let existing = uniqueCustomers.get(record.phone);
                 existing.name = record.name;
                 existing.source = "Berdaftar";
                 uniqueCustomers.set(record.phone, existing);
              }
           } else {
              uniqueCustomers.set(record.phone, record);
           }
        });
  
        res.json(Array.from(uniqueCustomers.values()));
      } catch (err) {
        console.error("Marketing API Error:", err);
        res.status(500).json({ error: "Ralat pelayan: " + err.message });
      }
    }`;

js = js.replace(regex, newBlock);
fs.writeFileSync('routes/owner.js', js);
console.log("Updated marketing-customers logic successfully");
