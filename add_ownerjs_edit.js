const fs = require('fs');
let js = fs.readFileSync('public/owner/js/owner.js', 'utf8');

const editReqLogic = `
// ==========================================
// EDIT REQUESTS LOGIC
// ==========================================
async function fetchEditRequests() {
    try {
        const res = await fetch('/api/owner/edit-requests', {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem("din_token_sys") }
        });
        const result = await res.json();
        const tbody = document.getElementById("editRequestsTableBody");
        const badgeOrders = document.getElementById("badge-orders");
        const badgeEdit = document.getElementById("badge-edit-requests");
        
        if (result.status === "success" && result.data && result.data.length > 0) {
            tbody.innerHTML = result.data.map(r => \`
                <tr>
                    <td>\${r.staff ? r.staff.username : 'Staf'}</td>
                    <td><strong style="color:red;">\${r.reason}</strong></td>
                    <td>RM\${r.old_price} &rarr; <strong>RM\${r.new_price}</strong><br><small>\${r.old_payment_method} &rarr; \${r.new_payment_method}</small></td>
                    <td>
                        <button class="btn btn-primary" style="padding:4px 8px; font-size:12px;" onclick="resolveEditRequest('\${r.id}', 'Approve')">Lulus</button>
                        <button class="btn btn-secondary" style="padding:4px 8px; font-size:12px; background:red; margin-left:5px;" onclick="resolveEditRequest('\${r.id}', 'Reject')">Tolak</button>
                    </td>
                </tr>
            \`).join("");
            
            badgeOrders.style.display = "inline-block";
            badgeOrders.innerText = result.data.length;
            badgeEdit.style.display = "inline-block";
            badgeEdit.innerText = result.data.length;
        } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Tiada permohonan edit buat masa ini.</td></tr>';
            badgeOrders.style.display = "none";
            badgeEdit.style.display = "none";
        }
    } catch(err) {
        console.error("Gagal load edit requests", err);
    }
}

async function resolveEditRequest(request_id, action) {
    if (!confirm(\`Anda pasti mahu \${action === 'Approve' ? 'MELULUSKAN' : 'MENOLAK'} permohonan edit ini?\`)) return;
    
    try {
        const res = await fetch('/api/owner/resolve-edit-request', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem("din_token_sys") 
            },
            body: JSON.stringify({ request_id, action })
        });
        const data = await res.json();
        alert(data.message);
        
        // Refresh 
        fetchEditRequests();
        if(action === 'Approve') {
            loadDashboardData();
        }
    } catch(err) {
        alert("Ralat memproses permohonan.");
    }
}
`;

if (!js.includes('fetchEditRequests')) {
    js = js + '\n' + editReqLogic;
    
    // Inject fetchEditRequests() inside init()
    js = js.replace('loadDashboardData();', 'loadDashboardData();\n    fetchEditRequests();');
    
    fs.writeFileSync('public/owner/js/owner.js', js);
    console.log("Updated owner.js");
} else {
    console.log("Already updated owner.js");
}
