const fs = require('fs');
let auth = fs.readFileSync('routes/auth.js', 'utf8');

const injection = `
const { authenticate, requireRole } = require("../middleware/auth");

router.put("/profile", authenticate, requireRole(["customer"]), async (req, res) => {
  try {
    const { name, phone, address, avatar_url } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;

    const { data, error } = await supabase
      .from("customers")
      .update(updates)
      .eq("id", req.user.id)
      .select("id, name, phone, address, avatar_url")
      .single();

    if (error) throw error;
    res.json({ status: "success", user: data, message: "Profil berjaya dikemaskini!" });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ status: "error", message: "Nombor telefon ini sudah wujud." });
    }
    res.status(500).json({ status: "error", message: error.message });
  }
});
`;

if (!auth.includes('router.put("/profile"')) {
    auth = auth + '\n' + injection;
    fs.writeFileSync('routes/auth.js', auth);
    console.log("Injected profile update route.");
} else {
    console.log("Route already exists.");
}
