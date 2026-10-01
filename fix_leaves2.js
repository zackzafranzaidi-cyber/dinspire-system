const fs = require('fs');

let staff = fs.readFileSync('routes/staff.js', 'utf8');

const targetRoute = /router\.get\("\/leaves"[\s\S]*?res\.json\(\{ status: "success", leaves: leaves \|\| \[\] \}\);/;

const newRoute = `router.get("/leaves", authenticate, requireRole(["staff"]), async (req, res) => {
  const staff_id = req.user.id;
  try {
    const today = new Date();
    const myTime = new Date(today.getTime() + 8 * 60 * 60 * 1000);
    const firstDay = new Date(myTime.getFullYear(), myTime.getMonth(), 1).toISOString().split('T')[0];

    const { data: stData } = await supabase.from("staff").select("branch_id").eq("id", staff_id).single();
    const branch_id = stData ? stData.branch_id : null;

    if (!branch_id) {
      return res.json({ status: "success", leaves: [] });
    }

    const { data: leaves } = await supabase
      .from("staff_leaves")
      .select("tarikh")
      .eq("branch_id", branch_id)
      .neq("staff_id", staff_id)
      .gte("tarikh", firstDay);

    res.json({ status: "success", leaves: leaves || [] });`;

if (targetRoute.test(staff)) {
    staff = staff.replace(targetRoute, newRoute);
    fs.writeFileSync('routes/staff.js', staff);
    console.log("Updated /leaves API!");
} else {
    console.log("Regex failed");
}
