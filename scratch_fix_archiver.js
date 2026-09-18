const fs = require('fs');
let js = fs.readFileSync('utils/archiver.js', 'utf8');

// Fix generateArchiveDataByDateRange
const targetArchive = `        let price = parseFloat(r.harga_rm || r.total_price || 0);
        let fee = parseFloat(r.service_fee || r.shipping_fee || 0);`;
const fixArchive = `        let price = parseFloat(r.harga_rm || r.total_price || 0);
        let fee = parseFloat(r.service_fee || r.shipping_fee || 0);
        
        // [DIBAIKI] product_orders tidak mempunyai lajur total_price, perlu dikira secara dinamik
        if (category === "Produk" && r.senarai_produk) {
            try {
                let parsedItems = typeof r.senarai_produk === "string" ? JSON.parse(r.senarai_produk) : r.senarai_produk;
                let calcPrice = 0;
                for (let id in parsedItems) {
                   calcPrice += (parseFloat(parsedItems[id].price) || 0) * (parseInt(parsedItems[id].qty) || 0);
                }
                price = calcPrice;
            } catch (e) {
                console.error("Gagal mengira harga produk dalam arkib", e);
            }
        }`;
js = js.replace(targetArchive, fixArchive);

// Fix pruneYearlyData
const targetPruneQuery = `          supabase.from("product_orders").select("total_price").gte("created_at", startDate).lt("created_at", endDate).eq("status", "Completed")`;
const fixPruneQuery = `          supabase.from("product_orders").select("senarai_produk, shipping_fee").gte("created_at", startDate).lt("created_at", endDate).eq("status", "Completed")`;
js = js.replace(targetPruneQuery, fixPruneQuery);

const targetPruneCalc = `       let total_produk = 0;
       if (p) {
          p.forEach(r => total_produk += parseFloat(r.total_price || 0));
       }`;
const fixPruneCalc = `       let total_produk = 0;
       if (p) {
          p.forEach(r => {
             let prodPrice = 0;
             if (r.senarai_produk) {
                 try {
                     let parsed = typeof r.senarai_produk === "string" ? JSON.parse(r.senarai_produk) : r.senarai_produk;
                     for (let id in parsed) {
                         prodPrice += (parseFloat(parsed[id].price) || 0) * (parseInt(parsed[id].qty) || 0);
                     }
                 } catch (e) {}
             }
             total_produk += prodPrice + parseFloat(r.shipping_fee || 0);
          });
       }`;
js = js.replace(targetPruneCalc, fixPruneCalc);

fs.writeFileSync('utils/archiver.js', js);
console.log('Fixed archiver bugs');
