const fs = require('fs');
let code = fs.readFileSync('routes/staff.js', 'utf8');

const targetStr = `module.exports = router;`;

const replacementStr = `
// ==========================================
// Semak Nombor Telefon (Master Directory)
// ==========================================
router.get("/lookup-phone", authenticate, requireRole(["staff", "owner", "admin"]), async (req, res) => {
  const phone = req.query.phone;
  if (!phone) return res.json({ found: false });
  
  const formatPhone = (phone) => {
    let p = String(phone).replace(/\\D/g, "");
    if (p.startsWith("0")) p = "6" + p;
    else if (p.startsWith("+60")) p = p.substring(1);
    else if (!p.startsWith("60")) p = "60" + p;
    return p;
  };
  
  const formatted = formatPhone(phone);
  try {
     const { data, error } = await supabase.from("customer_directory").select("real_name").eq("phone_number", formatted).maybeSingle();
     if (data && data.real_name) {
        res.json({ found: true, name: data.real_name });
     } else {
        res.json({ found: false });
     }
  } catch(e) {
     res.json({ found: false });
  }
});

module.exports = router;`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('routes/staff.js', code);
console.log("Added lookup route to staff.js");
