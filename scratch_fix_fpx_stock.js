const fs = require('fs');
let js = fs.readFileSync('routes/bookings.js', 'utf8');

const targetStr = `      } catch (err) {
        return res.status(502).json({
           status: "error",
           message: err.message || "Gagal berhubung dengan gateway FPX"
        });
      }`;

const fixStr = `      } catch (err) {
        // [DIBAIKI] Pulangkan stok kembali jika FPX gagal
        for (let id in trustedCartItems) {
           let p = trustedCartItems[id];
           supabase.from("products").select("stok").eq("id", id).maybeSingle().then(({data}) => {
               if(data) {
                   supabase.from("products").update({ stok: (parseInt(data.stok) || 0) + p.qty }).eq("id", id).then();
               }
           });
        }
        return res.status(502).json({
           status: "error",
           message: err.message || "Gagal berhubung dengan gateway FPX"
        });
      }`;

js = js.replace(targetStr, fixStr);
fs.writeFileSync('routes/bookings.js', js);
console.log('Fixed stock leak on FPX failure');
