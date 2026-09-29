const fs = require('fs');
let content = fs.readFileSync('routes/staff.js', 'utf8');

const apiString = `
// ==========================================
// KEMUKAKAN PERMOHONAN EDIT TRANSAKSI (EDIT REQUEST)
// ==========================================
router.post("/request-edit", authenticate, requireRole(["staff", "owner"]), async (req, res) => {
  try {
    const { transaction_table, transaction_id, old_price, new_price, old_payment_method, new_payment_method, reason } = req.body;
    
    if (!transaction_table || !transaction_id || !new_price || !reason) {
      return res.status(400).json({ status: "error", message: "Data tidak lengkap" });
    }

    const { error } = await supabase.from("edit_requests").insert({
      transaction_table,
      transaction_id,
      staff_id: req.user.id,
      old_price: parseFloat(old_price),
      new_price: parseFloat(new_price),
      old_payment_method,
      new_payment_method,
      reason
    });

    if (error) throw error;
    
    // Trigger Push Notification to Owner
    try {
        const { data: owners } = await supabase.from('owners').select('username');
        if (owners && owners.length > 0) {
            const pushTokens = await getPushTokensForUsers(owners.map(o => o.username));
            if (pushTokens.length > 0) {
                const payload = JSON.stringify({
                    title: 'Permohonan Edit Transaksi 📝',
                    body: \`\${req.user.username} memohon untuk edit harga ke RM\${new_price}. Sila semak.\`,
                    url: '/owner/index.html',
                    icon: '/icon-192x192.png'
                });
                for (let sub of pushTokens) {
                    try { await webpush.sendNotification(sub, payload); } catch (e) {}
                }
            }
        }
    } catch(e) {}

    res.json({ status: "success", message: "Permohonan berjaya dihantar kepada Owner" });
  } catch (error) {
    console.error("Edit Request Error:", error);
    res.status(500).json({ status: "error", message: "Gagal menghantar permohonan" });
  }
});
`;

content = content.replace('module.exports = router;', apiString + '\nmodule.exports = router;');
fs.writeFileSync('routes/staff.js', content);
console.log("Added /request-edit to staff.js");
