const fs = require('fs');
let staffjs = fs.readFileSync('public/staff/js/staff.js', 'utf8');

const regex = /let editBtn = "";\s*if \(b\.status === "Rejected"\) \{\s*editBtn = `<button class="btn btn-primary" style="margin-top:10px; width:100%; font-size:12px;" \n*onclick="verifyPayment\('\$\{escapeHTML\(b\.order_no\)\}', 'approve'\)"><i class="fas fa-edit mr-2"><\/i> Undo Reject<\/button>`;\s*\}/;

const replacement = `let editBtn = "";
        if (b.status === "Rejected") {
            editBtn = \`<button class="btn btn-primary" style="margin-top:10px; width:100%; font-size:12px;" onclick="verifyPayment('\${escapeHTML(b.order_no)}', 'approve')"><i class="fas fa-edit mr-2"></i> Undo Reject</button>\`;
        } else if (b.status === "Selesai") {
            let tableStr = String(b.order_no).startsWith("#WLK-") ? "walkin_records" : (String(b.order_no).startsWith("TR") ? "treatment_records" : "booking_records");
            editBtn = \`<button class="btn btn-secondary" style="margin-top:10px; width:100%; font-size:12px; background:white; color:#333; border:1px solid #ccc; display:block;" onclick="openRequestEditModal('\${b.id || b.order_no}', '\${tableStr}', \${b.final_price || b.price}, '\${method}')"><i class="fas fa-pen mr-2"></i> Edit Rekod</button>\`;
        }`;

staffjs = staffjs.replace(regex, replacement);
fs.writeFileSync('public/staff/js/staff.js', staffjs);
console.log("Updated staff.js editBtn");
