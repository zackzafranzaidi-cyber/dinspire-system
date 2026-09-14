const fs = require('fs');

// 1. UPDATE routes/staff.js
let staffRoute = fs.readFileSync('routes/staff.js', 'utf8');

const newStaffRoutes = `
router.get("/my-seen-badge", authenticate, requireRole(["staff", "owner"]), async (req, res) => {
    try {
        const { data } = await supabase.from("settings").select("setting_value").eq("setting_key", \`seen_leaves_\${req.user.id}\`).maybeSingle();
        res.json({ status: "success", count: data ? parseInt(data.setting_value) : 0 });
    } catch(err) {
        res.json({ status: "error", count: 0 });
    }
});

router.post("/update-seen-badge", authenticate, requireRole(["staff", "owner"]), async (req, res) => {
    try {
        await supabase.from("settings").upsert({
            setting_key: \`seen_leaves_\${req.user.id}\`,
            setting_value: String(req.body.count),
            description: "Staff badge seen count"
        });
        res.json({ status: "success" });
    } catch(err) {
        res.json({ status: "error" });
    }
});

module.exports = router;`;
staffRoute = staffRoute.replace(/module\.exports\s*=\s*router;/, newStaffRoutes);
fs.writeFileSync('routes/staff.js', staffRoute);


// 2. UPDATE routes/owner.js
let ownerRoute = fs.readFileSync('routes/owner.js', 'utf8');

const newOwnerRoutes = `
router.get("/seen-badges", authenticate, requireRole(["owner"]), async (req, res) => {
    try {
        const { data } = await supabase.from("settings").select("setting_key, setting_value").like("setting_key", "seen_%_owner");
        let badges = {};
        if (data) {
            data.forEach(s => {
                badges[s.setting_key.replace("_owner", "")] = parseInt(s.setting_value) || 0;
            });
        }
        res.json({ status: "success", badges });
    } catch(err) {
        res.json({ status: "error", badges: {} });
    }
});

router.post("/update-seen-badge", authenticate, requireRole(["owner"]), async (req, res) => {
    try {
        const { type, count } = req.body;
        await supabase.from("settings").upsert({
            setting_key: \`seen_\${type}_owner\`,
            setting_value: String(count),
            description: "Owner badge seen count"
        });
        res.json({ status: "success" });
    } catch(err) {
        res.json({ status: "error" });
    }
});

module.exports = router;`;
ownerRoute = ownerRoute.replace(/module\.exports\s*=\s*router;/, newOwnerRoutes);
fs.writeFileSync('routes/owner.js', ownerRoute);

