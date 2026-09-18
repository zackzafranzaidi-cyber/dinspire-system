const fs = require('fs');
let js = fs.readFileSync('routes/bookings.js', 'utf8');

// Fix 1: toyyibpay catch block in /
js = js.replace(`    } catch (err) {
      return res.status(502).json({
         status: "error",
         message: err.message || "Gagal berhubung dengan gateway FPX"
      });
    }`, `    } catch (err) {
      if (typeof lockKey !== 'undefined') bookingLocks.delete(lockKey);
      return res.status(502).json({
         status: "error",
         message: err.message || "Gagal berhubung dengan gateway FPX"
      });
    }`);

// Fix 2: toyyibpay catch block in /oncall
js = js.replace(`      } catch (err) {
        return res.status(502).json({
           status: "error",
           message: err.message || "Gagal berhubung dengan gateway FPX"
        });
      }`, `      } catch (err) {
        if (typeof lockKey !== 'undefined') oncallLocks.delete(lockKey);
        return res.status(502).json({
           status: "error",
           message: err.message || "Gagal berhubung dengan gateway FPX"
        });
      }`);

// Fix 3: /oncall if (!svc)
js = js.replace(`      if (!svc) return res.status(400).json({ status: "error", message: "Servis tidak dijumpai." });`, `      if (!svc) {
        if (typeof lockKey !== 'undefined') oncallLocks.delete(lockKey);
        return res.status(400).json({ status: "error", message: "Servis tidak dijumpai." });
      }`);

// Fix 4: /oncall if (!receipt_url)
js = js.replace(`      if (payment_method === "qr") {
        if (!receipt_url) {
          return res.status(400).json({ status: "error", message: "Resit pembayaran QR diperlukan." });
        }`, `      if (payment_method === "qr") {
        if (!receipt_url) {
          if (typeof lockKey !== 'undefined') oncallLocks.delete(lockKey);
          return res.status(400).json({ status: "error", message: "Resit pembayaran QR diperlukan." });
        }`);

fs.writeFileSync('routes/bookings.js', js);
console.log('Fixed lock memory leaks');
