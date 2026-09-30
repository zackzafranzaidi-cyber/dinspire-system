const fs = require('fs');
let owner = fs.readFileSync('public/owner/js/owner.js', 'utf8');

// Find the resolveEdit function and update it
const resolveEditRegex = /window\.resolveEdit = async function\(request_id, action\) \{[\s\S]*?catch\(err\) \{[\s\S]*?alert\("Ralat memproses permohonan\."\);[\s\S]*?\}[\s\S]*?\}/;

const newResolveEdit = `window.resolveEdit = async function(request_id, action) {
      if (!confirm(\`Anda pasti mahu \${action === 'Approve' ? 'MELULUSKAN' : 'MENOLAK'} permohonan edit ini?\`)) return;
      
      try {
          const res = await fetch(\`\${API_BASE_URL}/owner/resolve-edit-request\`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ request_id, action })
          });
          const data = await res.json();
          
          // [DIBAIKI] Buang dari UI terus supaya tak keliru / tak tertekan dua kali
          if (data.status === 'success' || data.message === 'Permohonan telah diselesaikan.') {
              let idx = masterData.editRequests.findIndex(r => r.id === request_id);
              if (idx > -1) {
                  masterData.editRequests.splice(idx, 1);
                  renderEditRequestsModal(); // Render semula widget
              }
          }
          
          // Refresh background data secara senyap
          fetchEditRequests();
          if(action === 'Approve') {
              fetchOwnerDashboardData(true);
          }
          
          // Delay alert sedikit supaya UI sempat refresh di background
          setTimeout(() => {
              alert(data.message);
          }, 100);
          
      } catch(err) {
          alert("Ralat memproses permohonan.");
      }
  }`;

owner = owner.replace(resolveEditRegex, newResolveEdit);
fs.writeFileSync('public/owner/js/owner.js', owner);
console.log("Updated resolveEdit to prevent double clicking and UI freeze");
