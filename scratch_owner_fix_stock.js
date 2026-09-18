const fs = require('fs');
let js = fs.readFileSync('routes/owner.js', 'utf8');

const targetLogic = `      if (action === "approve") {
        const { data, error } = await supabase
          .from("product_orders")
          .update({ status: "Preparing" })
          .eq("id", order_id)
          .select("customer_id")
          .single();
        if (error) throw error;`;

const fixLogic = `      const { data: currentOrder } = await supabase.from("product_orders").select("status, senarai_produk, customer_id").eq("id", order_id).single();
      if (!currentOrder) return res.status(404).json({ error: "Pesanan tidak wujud" });

      if (action === "approve") {
        // [DIBAIKI] Inventori Leak: Potong stok balik jika Undo Reject
        if (currentOrder.status === "Rejected") {
            try {
                const items = typeof currentOrder.senarai_produk === "string" ? JSON.parse(currentOrder.senarai_produk) : currentOrder.senarai_produk;
                for (let id in items) {
                    let qty = parseInt(items[id].qty) || 0;
                    if (qty > 0) {
                       const { data: pData } = await supabase.from("products").select("stok").eq("id", id).maybeSingle();
                       if (pData) {
                           let currentStok = parseInt(pData.stok) || 0;
                           await supabase.from("products").update({ stok: Math.max(0, currentStok - qty) }).eq("id", id);
                       }
                    }
                }
            } catch (e) {
                console.error("Gagal potong stok semasa Undo Reject:", e);
            }
        }

        const { data, error } = await supabase
          .from("product_orders")
          .update({ status: "Preparing" })
          .eq("id", order_id)
          .select("customer_id")
          .single();
        if (error) throw error;`;

js = js.replace(targetLogic, fixLogic);
fs.writeFileSync('routes/owner.js', js);
console.log('Fixed stock duplication vulnerability');
