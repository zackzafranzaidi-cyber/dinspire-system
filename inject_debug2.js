const fs = require('fs');
let code = fs.readFileSync('public/staff/js/staff.js', 'utf8');

const regex = /const data = await res\.json\(\);\s*if \(data\.found && data\.name\) \{[\s\S]*?wiNameInput\.addEventListener\("input", resetColor\);\s*\}/;

const newLogic = `const data = await res.json();
          if (typeof showToast === "function") showToast("API: " + JSON.stringify(data));
          
          if (data.found && data.name) {
              wiNameInput.value = data.name;
              wiNameInput.style.color = "var(--success)";
              
              const resetColor = () => {
                 wiNameInput.style.color = "";
                 wiNameInput.removeEventListener("input", resetColor);
              };
              wiNameInput.addEventListener("input", resetColor);
          }`;

if (regex.test(code)) {
    code = code.replace(regex, newLogic);
    fs.writeFileSync('public/staff/js/staff.js', code);
    console.log("Injected debug toasts");
} else {
    console.log("Regex not found");
}
