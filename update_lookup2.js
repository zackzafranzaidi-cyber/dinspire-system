const fs = require('fs');
let code = fs.readFileSync('public/staff/js/staff.js', 'utf8');

const startMarker = '// AUTO-FILL PHONE LOOKUP (KLIK NAMA)';
const idxStart = code.indexOf(startMarker);
if (idxStart > -1) {
    let before = code.substring(0, idxStart);
    
    // Find the end of the file or the end of the block
    let endOfBlock = code.indexOf('});\n', idxStart) + 4;
    let after = code.substring(endOfBlock);

    const newInjection = `// AUTO-FILL PHONE LOOKUP (KLIK NAMA)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const wiPhoneInput = document.getElementById("wi-phone");
  const wiNameInput = document.getElementById("wi-name");

  if (wiPhoneInput && wiNameInput) {
    const handleAutoFill = async () => {
       if (wiNameInput.value.trim() !== "") return;
       const val = wiPhoneInput.value.trim();
       if (val.length < 9) return; // Allow 9 digits minimum
       
       try {
          const sysToken = localStorage.getItem("din_token_sys");
          const baseUrl = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : '/api';
          const res = await fetch(\`\${baseUrl}/staff/lookup-phone?phone=\${val}\`, {
              headers: { Authorization: \`Bearer \${sysToken}\` }
          });
          const data = await res.json();
          if (data.found && data.name) {
              wiNameInput.value = data.name;
              wiNameInput.style.color = "var(--success)";
              if (typeof showToast === "function") showToast("Nama diisi automatik.");
              
              const resetColor = () => {
                 wiNameInput.style.color = "";
                 wiNameInput.removeEventListener("input", resetColor);
              };
              wiNameInput.addEventListener("input", resetColor);
          }
       } catch(err) {
          console.error("Lookup error:", err);
       }
    };

    wiNameInput.addEventListener("focus", handleAutoFill);
    wiNameInput.addEventListener("click", handleAutoFill);
    
    // Also trigger when phone input loses focus (user taps next)
    wiPhoneInput.addEventListener("blur", () => {
        setTimeout(handleAutoFill, 200);
    });
  }
});
`;
    code = before + newInjection + after;
    fs.writeFileSync('public/staff/js/staff.js', code);
    console.log("Updated auto-fill logic to be more robust!");
}
