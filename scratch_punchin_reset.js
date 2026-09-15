const fs = require('fs');
let js = fs.readFileSync('public/js/staff.js', 'utf8');

const regex = /\} else \{\s*alert\("Ralat: " \+ data\.message\);\s*hideGlobalLoader\(\);\s*\}/;

const newLogic = `} else {
               alert("Ralat: " + data.message);
               hideGlobalLoader();
               
               // [DIBAIKI] Force status punch-in false jika server reject 403
               if (data.message && data.message.includes("Punch-In")) {
                  staffData.isPunchedIn = false;
                  switchView("dashboard");
               }
            }`;

if (regex.test(js)) {
    js = js.replace(regex, newLogic);
    fs.writeFileSync('public/js/staff.js', js);
    console.log("Replaced with regex.");
} else {
    console.log("Regex failed.");
}
