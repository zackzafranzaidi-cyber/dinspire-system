const fs = require('fs');
let js = fs.readFileSync('public/staff/js/staff.js', 'utf8');

const targetStr = `function submitWalkIn() {
  const form = document.getElementById("walkin-form");
  const phone = document.getElementById("wi-phone").value.trim();
  const category = document.getElementById("wi-category").value;
    const serviceId = document.getElementById("wi-service").value;
  const paymentMethod = document.getElementById("wi-payment").value;
  const fileInput = document.getElementById("wi-receipt").files[0];

  if (!phone || !category || !serviceId || !paymentMethod) {
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
    compressImage(fileInput, (base64) => {
      const now = new Date();
      const payload = {
        customer_name: document.getElementById("wi-name").value.trim(),
        no_phone: phone,`;

const replacementStr = `function submitWalkIn() {
  const phone = document.getElementById("wi-phone").value.trim();
  const customerName = document.getElementById("wi-name").value.trim();
  const category = document.getElementById("wi-category").value;
  const serviceId = document.getElementById("wi-service").value;
  const paymentMethod = document.getElementById("wi-payment").value;
  const fileInput = document.getElementById("wi-receipt").files[0];

  if (!category || !serviceId || !paymentMethod) {
    return alert("Sila lengkapkan maklumat servis dan kaedah bayaran.");
  }
  
  if (phone && (!phone.startsWith("01") || phone.length < 10)) {
    return alert("Sila masukkan no telefon sah (mula 01...).");
  }
  if (paymentMethod === "QR" && !fileInput) {
    return alert("Sila muat naik gambar resit transaksi DuitNow/QR sebelum tekan selesai!");
  }

  const priceInput = parseFloat(document.getElementById("wi-price").value);
  if (isNaN(priceInput) || priceInput < 1) {
    return alert("Sila masukkan harga yang sah (minimum RM1.00).");
  }

  const executeSubmit = () => {
    showGlobalLoader();
    try {
      compressImage(fileInput, (base64) => {
        const now = new Date();
        const payload = {
          customer_name: customerName,
          no_phone: phone,`;

if(js.includes('if (!phone || !category || !serviceId || !paymentMethod)')) {
    js = js.replace(targetStr, replacementStr);
    
    // We need to find where the try/catch ends and close the executeSubmit function and add the Swal logic.
    const tryBlockEnd = `        }

        fetch(\`\${API_BASE_URL}/bookings/walkin\`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: \`Bearer \${sysToken}\`,
          },
          body: JSON.stringify(payload),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.message && data.message.includes("berjaya")) {
              handleSuccess(data.message);
            } else {
              hideGlobalLoader();
              alert(data.message || "Ralat menyimpan rekod.");
            }
          })
          .catch((err) => {
            hideGlobalLoader();
            alert("Ralat pelayan.");
          });
      });
    } catch (err) {
      hideGlobalLoader();
      alert("Ralat memproses imej: " + err.message);
    }
  }`;

    const newTryBlockEnd = `        }

        fetch(\`\${API_BASE_URL}/bookings/walkin\`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: \`Bearer \${sysToken}\`,
          },
          body: JSON.stringify(payload),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.message && data.message.includes("berjaya")) {
              handleSuccess(data.message);
            } else {
              hideGlobalLoader();
              alert(data.message || "Ralat menyimpan rekod.");
            }
          })
          .catch((err) => {
            hideGlobalLoader();
            alert("Ralat pelayan.");
          });
      });
    } catch (err) {
      hideGlobalLoader();
      alert("Ralat memproses imej: " + err.message);
    }
  };

  if (!customerName || !phone) {
    Swal.fire({
      title: 'Perhatian',
      text: 'Anda tidak memasukkan Nama atau No Telefon pelanggan. Teruskan menyimpan?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Teruskan',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        executeSubmit();
      }
    });
  } else {
    executeSubmit();
  }`;

    js = js.replace(tryBlockEnd, newTryBlockEnd);
    fs.writeFileSync('public/staff/js/staff.js', js);
    console.log("Updated staff.js for optional name/phone");
} else {
    console.log("Could not find the target string to replace in staff.js");
}
