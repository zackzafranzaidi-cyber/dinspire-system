const fs = require('fs');

let staff = fs.readFileSync('routes/staff.js', 'utf8');

const targetRoute = /router\.get\("\/my-leaves"[\s\S]*?res\.json\(\{ status: "success", leaves: leaves \|\| \[\] \}\);/;

const newRoute = `router.get("/my-leaves", authenticate, requireRole(["staff"]), async (req, res) => {
  try {
    const today = new Date();
    const myTime = new Date(today.getTime() + 8 * 60 * 60 * 1000);
    const firstDay = new Date(myTime.getFullYear(), myTime.getMonth(), 1).toISOString().split('T')[0];

    const { data: leaves } = await supabase
      .from("staff_leaves")
      .select("*")
      .eq("staff_id", req.user.id)
      .gte("tarikh", firstDay)
      .order("tarikh", { ascending: true });
    res.json({ status: "success", leaves: leaves || [] });`;

if (targetRoute.test(staff)) {
    staff = staff.replace(targetRoute, newRoute);
    fs.writeFileSync('routes/staff.js', staff);
    console.log("Updated my-leaves API!");
} else {
    console.log("Regex failed");
}
