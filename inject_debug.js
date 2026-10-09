const fs = require('fs');
let code = fs.readFileSync('public/staff/js/staff.js', 'utf8');

// replace the handleAutoFill logic to show more toasts for debugging
const oldLogic = `          const data = await res.json();
          if (data.found && data.name) {
              wiNameInput.value = data.name;
              wiNameInput.style.color = "var(--success)";
              if (typeof showToast === "function") showToast("Nama diisi automatik.");
              
              const resetColor = () => {
                 wiNameInput.style.color = "";
                 wiNameInput.removeEventListener("input", resetColor);
              };
              wiNameInput.addEventListener("input", resetColor);
          }`;

const newLogic = `          const data = await res.json();
          if (typeof showToast === "function") showToast("API Return: " + JSON.stringify(data));
          
          if (data.found && data.name) {
              wiNameInput.value = data.name;
              wiNameInput.style.color = "var(--success)";
              
              const resetColor = () => {
                 wiNameInput.style.color = "";
                 wiNameInput.removeEventListener("input", resetColor);
              };
              wiNameInput.addEventListener("input", resetColor);
          } else {
              if (typeof showToast === "function") showToast("Gagal jumpa nama di DB.");
          }`;

if (code.includes(oldLogic)) {
    code = code.replace(oldLogic, newLogic);
    fs.writeFileSync('public/staff/js/staff.js', code);
    console.log("Injected debug toasts");
} else {
    console.log("Could not find logic to replace");
}
