const fs = require('fs');
let js = fs.readFileSync('public/js/staff.js', 'utf8');

// The exact original function start
const originalFunction = `function submitWalkIn() {
  const form = document.getElementById("walkin-form");
  const phone = document.getElementById("wi-phone").value.trim();
  const serviceId = document.getElementById("wi-service").value;
  const paymentMethod = document.getElementById("wi-payment").value;
  const fileInput = document.getElementById("wi-receipt").files[0];

  if (!phone || !serviceId || !paymentMethod) {
    return alert("Sila lengkapkan semua maklumat Walk-In.");
  }
  if (!phone.startsWith("01") || phone.length < 10) {
    return alert("Sila masukkan no telefon sah (mula 01...).");
  }
  if (paymentMethod === "QR" && !fileInput) {
    return alert("Sila muat naik gambar resit transaksi DuitNow/QR sebelum tekan selesai!");
  }

  const priceInput = parseFloat(document.getElementById("wi-price").value);
  if (isNaN(priceInput) || priceInput < 1) {
    return alert("Sila masukkan harga yang sah (minimum RM1.00).");
  }

  showGlobalLoader();
  try {
    compressImage(fileInput, (base64) => {`;

// The exact new function start
const newFunction = `function submitWalkIn() {
  const form = document.getElementById("walkin-form");
  const name = document.getElementById("wi-name").value.trim();
  const phone = document.getElementById("wi-phone").value.trim();
  const serviceId = document.getElementById("wi-service").value;
  const paymentMethod = document.getElementById("wi-payment").value;
  const fileInput = document.getElementById("wi-receipt").files[0];
  const btn = document.getElementById("btn-submit-walkin");

  if (!name) {
    return alert("Sila masukkan nama pelanggan.");
  }
  if (!phone || !serviceId || !paymentMethod) {
    return alert("Sila lengkapkan semua maklumat Walk-In.");
  }
  if (!phone.startsWith("01") || phone.length < 10) {
    return alert("Sila masukkan no telefon sah (mula 01...).");
  }
  if (paymentMethod === "QR" && !fileInput) {
    return alert("Sila muat naik gambar resit transaksi DuitNow/QR sebelum tekan selesai!");
  }

  const priceInput = parseFloat(document.getElementById("wi-price").value);
  if (isNaN(priceInput) || priceInput < 1) {
    return alert("Sila masukkan harga yang sah (minimum RM1.00).");
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Menyimpan...';
  }
  showGlobalLoader();
  try {
    compressImage(fileInput, (base64) => {`;

js = js.replace(originalFunction, newFunction);

// Now for the catch and error blocks inside submitWalkIn
const oldFetchBlock = `        fetch(\`\${API_BASE_URL}/bookings/walkin\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success") {
            handleSuccess("Rekod Walk-In Berjaya Disimpan!");
          } else {
             alert("Ralat: " + data.message);
             hideGlobalLoader();
          }
        })
        .catch((err) => {
          OfflineSyncManager.saveToQueue(\`\${API_BASE_URL}/bookings/walkin\`, "POST", payload, "Rekod Walk-In Berjaya Disimpan!");
          handleSuccess("Gagal berhubung. Data disimpan offline.");
        });
    });
  } catch (err) {
    hideGlobalLoader();
  }
}`;

const newFetchBlock = `        fetch(\`\${API_BASE_URL}/bookings/walkin\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success") {
            handleSuccess("Rekod Walk-In Berjaya Disimpan!");
          } else {
             alert("Ralat: " + data.message);
             hideGlobalLoader();
             
             // [DIBAIKI] Force status punch-in false jika server reject 403
             if (data.message && data.message.includes("Punch-In")) {
                staffData.isPunchedIn = false;
                switchView("dashboard");
             }
          }
        })
        .catch((err) => {
          OfflineSyncManager.saveToQueue(\`\${API_BASE_URL}/bookings/walkin\`, "POST", payload, "Rekod Walk-In Berjaya Disimpan!");
          handleSuccess("Gagal berhubung. Data disimpan offline.");
        })
        .finally(() => {
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'Sahkan Walk-In';
          }
        });
    });
  } catch (err) {
    hideGlobalLoader();
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Sahkan Walk-In';
    }
  }
}`;

js = js.replace(oldFetchBlock, newFetchBlock);

fs.writeFileSync('public/js/staff.js', js);
console.log("Safely replaced submitWalkIn logic.");
