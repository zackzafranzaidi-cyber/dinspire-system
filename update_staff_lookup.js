const fs = require('fs');
let code = fs.readFileSync('public/staff/js/staff.js', 'utf8');

const injectionCode = `
// ==========================================
// AUTO-FILL PHONE LOOKUP (MASTER DIRECTORY)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const wiPhoneInput = document.getElementById("wi-phone");
  const wiNameInput = document.getElementById("wi-name");
  let phoneDebounceTimer;

  if (wiPhoneInput && wiNameInput) {
    wiPhoneInput.addEventListener("input", (e) => {
       const val = e.target.value.trim();
       clearTimeout(phoneDebounceTimer);
       
       if (val.length < 10) {
           wiNameInput.readOnly = false;
           wiNameInput.style.backgroundColor = "";
           wiNameInput.style.color = "";
           return;
       }
       
       phoneDebounceTimer = setTimeout(async () => {
          try {
             const sysToken = localStorage.getItem("din_token_sys");
             const res = await fetch(\`\${API_BASE_URL}/staff/lookup-phone?phone=\${val}\`, {
                 headers: { Authorization: \`Bearer \${sysToken}\` }
             });
             const data = await res.json();
             if (data.found && data.name) {
                 wiNameInput.value = data.name;
                 wiNameInput.readOnly = true;
                 wiNameInput.style.backgroundColor = "var(--bg-card)";
                 wiNameInput.style.color = "var(--success)";
                 if (typeof showToast === "function") showToast("Rekod pelanggan dijumpai!");
             } else {
                 wiNameInput.readOnly = false;
                 wiNameInput.style.backgroundColor = "";
                 wiNameInput.style.color = "";
             }
          } catch(err) {
             console.error("Lookup error:", err);
          }
       }, 500);
    });
  }
});
`;

code += injectionCode;
fs.writeFileSync('public/staff/js/staff.js', code);
console.log("Injected auto-fill logic into staff.js");
