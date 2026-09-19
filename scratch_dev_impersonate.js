const fs = require('fs');
let devJs = fs.readFileSync('routes/dev.js', 'utf8');

const additionalRoutes = `
// IMPERSONATION (Login-As)
router.post("/impersonate", authenticateDev, async (req, res) => {
  try {
    const { target_role, target_id } = req.body;
    
    if (!target_role || !target_id) {
      return res.status(400).json({ status: "error", message: "Parameter tidak lengkap." });
    }

    let tableName = "customers";
    if (target_role === "staff") tableName = "staff";
    else if (target_role === "owner") tableName = "owners";
    else if (target_role === "admin") tableName = "admins";

    const { data: user, error } = await supabase.from(tableName).select("*").eq("id", target_id).single();
    if (error || !user) return res.status(404).json({ status: "error", message: "Pengguna tidak dijumpai." });

    const isSys = ["staff", "owner", "admin"].includes(target_role);
    const secret = isSys ? process.env.JWT_SECRET_SYS : process.env.JWT_SECRET_CLIENT;
    const cookieName = isSys ? "din_token_sys" : "din_token_client";
    
    // Create impersonation token
    const token = jwt.sign(
      { 
        id: user.id, 
        role: target_role,
        is_impersonated: true,
        cawangan_id: user.cawangan_id || null
      },
      secret,
      { expiresIn: "1h" }
    );

    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: true, // Requires HTTPS in prod
      sameSite: "none",
      maxAge: 3600000,
    });

    res.json({ 
      status: "success", 
      message: \`Berjaya log masuk sebagai \${user.nama || user.name}\`,
      redirectUrl: isSys ? (target_role === 'staff' ? '/staff/' : '/owner/') : '/customer/'
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// SIMULASI WEBHOOK (FPX TESTER)
router.post("/simulate-fpx", authenticateDev, async (req, res) => {
  try {
    const { order_no, status_sim } = req.body; // status_sim: '1' for success, '3' for fail
    if (!order_no) return res.status(400).json({ status: "error", message: "Tiada no rujukan." });

    // Panggil laluan webhook kita sendiri secara dalaman atau guna axios ke localhost
    // Ini agak rumit jika tiada URL mutlak. Kita arahkan Dev panggil api/bookings/webhook/fpx terus dengan payload tiruan
    res.json({ 
       status: "success", 
       message: "Untuk simulasi, sila post payload berikut ke /api/bookings/webhook/fpx",
       payload_tiruan: {
          refno: order_no,
          status: status_sim || "1",
          billcode: "SIMULASI_" + Date.now()
       }
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});
`;

devJs = devJs.replace('module.exports = router;', additionalRoutes + '\nmodule.exports = router;');
fs.writeFileSync('routes/dev.js', devJs);
console.log('Added Impersonation to dev.js');
