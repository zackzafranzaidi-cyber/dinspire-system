const fs = require('fs');
let shop = fs.readFileSync('routes/shop.js', 'utf8');

const debugRoute = `
router.get("/debug-edit", async (req, res) => {
    try {
        const { data: reqs } = await supabase.from('edit_requests').select('*').order('created_at', { ascending: false }).limit(5);
        let results = [];
        for (let r of reqs || []) {
            let pkColumn = (r.transaction_table === "booking_records" || r.transaction_table === "oncall_records") ? "no_booking" : "id";
            const { data: trx } = await supabase.from(r.transaction_table).select('*').eq(pkColumn, r.transaction_id).single();
            results.push({ request: r, transaction: trx || "NOT FOUND" });
        }
        res.json(results);
    } catch(err) {
        res.json({error: err.message});
    }
});
`;

shop = shop.replace('module.exports = router;', debugRoute + '\nmodule.exports = router;');
fs.writeFileSync('routes/shop.js', shop);
console.log("Added debug route");
