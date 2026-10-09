const fs = require('fs');
let code = fs.readFileSync('public/staff/js/staff.js', 'utf8');

// Find the previously injected block
const startMarker = '// ==========================================';
const titleMarker = '// AUTO-FILL PHONE LOOKUP (MASTER DIRECTORY)';
const endMarker = '});'; // It ends the DOMContentLoaded

const idxStart = code.indexOf(titleMarker);
if (idxStart > -1) {
    // Find the DOMContentLoaded start
    let startDel = code.lastIndexOf('// ==========================================', idxStart);
    // Find the end of this block
    let endDel = code.indexOf('});', idxStart) + 3;
    
    let before = code.substring(0, startDel);
    let after = code.substring(endDel);
    
    // Check if there are trailing newlines
    if (after.startsWith('\n')) {
        after = after.substring(1);
    }

    const newInjection = `// ==========================================
// AUTO-FILL PHONE LOOKUP (KLIK NAMA)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const wiPhoneInput = document.getElementById("wi-phone");
  const wiNameInput = document.getElementById("wi-name");

  if (wiPhoneInput && wiNameInput) {
    wiNameInput.addEventListener("focus", async () => {
       // Hanya auto-fill jika kotak nama masih kosong
       if (wiNameInput.value.trim() !== "") return;
       
       const val = wiPhoneInput.value.trim();
       if (val.length < 10) return;
       
       try {
          const sysToken = localStorage.getItem("din_token_sys");
          // Gunakan API_BASE_URL jika ada, jika tiada fallback ke /api
          const baseUrl = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : '/api';
          const res = await fetch(\`\${baseUrl}/staff/lookup-phone?phone=\${val}\`, {
              headers: { Authorization: \`Bearer \${sysToken}\` }
          });
          const data = await res.json();
          if (data.found && data.name) {
              wiNameInput.value = data.name;
              // Membenarkan staf untuk edit nama tersebut (Tidak dilock)
              wiNameInput.style.color = "var(--success)";
              if (typeof showToast === "function") showToast("Nama diisi automatik. Boleh diedit jika perlu.");
              
              // Reset warna apabila staf mula menaip (mengubah nama)
              wiNameInput.addEventListener("input", function resetColor() {
                 wiNameInput.style.color = "";
                 wiNameInput.removeEventListener("input", resetColor);
              });
          }
       } catch(err) {
          console.error("Lookup error:", err);
       }
    });
  }
});
`;

    code = before + newInjection + after;
    fs.writeFileSync('public/staff/js/staff.js', code);
    console.log("Successfully updated staff.js lookup logic!");
} else {
    console.log("Could not find the injection block");
}
