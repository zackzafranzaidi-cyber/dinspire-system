const fs = require('fs');

let staff = fs.readFileSync('public/staff/js/staff.js', 'utf8');

const targetStr = /document\.getElementById\('edit_new_price'\)\.value = oldPrice;/;
const replacement = `document.getElementById('edit_new_price').value = oldPrice;
      document.getElementById('edit_new_price').readOnly = false; // default if not using dropdown yet
      if (document.getElementById("edit_category")) document.getElementById("edit_category").value = "";
      if (document.getElementById("edit_service")) document.getElementById("edit_service").value = "";
      if (document.getElementById("edit_service_group")) document.getElementById("edit_service_group").style.display = "none";
      if (oldPrice > 0) document.getElementById('edit_new_price').readOnly = true; // force them to select service if they want to edit`;

staff = staff.replace(targetStr, replacement);
fs.writeFileSync('public/staff/js/staff.js', staff);
console.log("Updated openRequestEditModal");
