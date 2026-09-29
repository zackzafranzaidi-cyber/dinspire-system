const fs = require('fs');
let content = fs.readFileSync('routes/owner.js', 'utf8');

const newEndpoints = `
// ==========================================
// EDIT REQUESTS (MAKER-CHECKER)
// ==========================================
router.get("/edit-requests", authenticate, requireRole(["owner"]), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("edit_requests")
      .select("*, staff(username)")
      .eq("status", "Pending")
      .order("created_at", { ascending: true });
      
    if (error) throw error;
    res.json({ status: "success", data: data || [] });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Gagal memuat turun edit requests" });
  }
});

router.post("/resolve-edit-request", authenticate, requireRole(["owner"]), async (req, res) => {
  try {
    const { request_id, action } = req.body; // action: 'Approve' or 'Reject'
    
    // 1. Fetch the request
    const { data: request, error: reqErr } = await supabase
      .from("edit_requests")
      .select("*")
      .eq("id", request_id)
      .single();
      
    if (reqErr || !request) throw reqErr || new Error("Request not found");
    if (request.status !== "Pending") {
      return res.status(400).json({ status: "error", message: "Permohonan telah diselesaikan." });
    }

    if (action === "Approve") {
      // 2. Update the original transaction table
      let updatePayload = { harga_rm: request.new_price };
      if (request.new_payment_method) {
        // Need to figure out the column name for payment method
        // In booking_records, oncall_records, walkin_records, treatment_records:
        if (request.transaction_table === 'booking_records' || request.transaction_table === 'oncall_records') {
            updatePayload.jenis_pembayaran = request.new_payment_method;
        } else if (request.transaction_table === 'walkin_records') {
            updatePayload.cara_bayaran = request.new_payment_method;
        } else if (request.transaction_table === 'treatment_records') {
            updatePayload.cara_bayaran = request.new_payment_method;
        }
      }

      const { error: updateErr } = await supabase
        .from(request.transaction_table)
        .update(updatePayload)
        .eq("id", request.transaction_id);
        
      if (updateErr) throw updateErr;
      
      // Update status to Approved
      await supabase.from("edit_requests").update({ status: "Approved" }).eq("id", request_id);
    } else {
      // Update status to Rejected
      await supabase.from("edit_requests").update({ status: "Rejected" }).eq("id", request_id);
    }
    
    res.json({ status: "success", message: "Berjaya dikemaskini" });
  } catch (error) {
    console.error("Resolve Edit Request Error:", error);
    res.status(500).json({ status: "error", message: "Gagal menyelesaikan permohonan" });
  }
});
`;

content = content.replace('module.exports = router;', newEndpoints + '\nmodule.exports = router;');
fs.writeFileSync('routes/owner.js', content);
console.log("Added Edit Requests APIs to owner.js");
