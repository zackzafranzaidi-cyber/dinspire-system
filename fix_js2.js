const fs = require('fs');
let js = fs.readFileSync('public/customer/js/customer.js', 'utf8');

const attachListener = `document.getElementById("form-register")?.addEventListener("submit", handleRegister);
    document.getElementById("form-edit-profile")?.addEventListener("submit", handleEditProfile);`;

js = js.replace('document.getElementById("form-register")?.addEventListener("submit", handleRegister);', attachListener);

const editProfileFunc = `
async function handleEditProfile(e) {
    e.preventDefault();
    if (!currentUser) return;
    
    const name = document.getElementById("edit-profile-name").value.trim();
    const phone = document.getElementById("edit-profile-phone").value.trim();
    const address = document.getElementById("edit-profile-address").value.trim();
    const avatar_url = document.getElementById("edit-profile-avatar-val").value;
    
    const btn = document.getElementById("btn-edit-profile-submit");
    const origText = btn.innerText;
    btn.innerText = "Menyimpan...";
    btn.disabled = true;
    
    try {
        const res = await fetch(API_BASE_URL + "/auth/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ name, phone, address, avatar_url })
        });
        const data = await res.json();
        
        if (data.status === "success") {
            if (typeof showToast === 'function') showToast("Profil berjaya dikemas kini.");
            else alert("Profil berjaya dikemas kini.");
            
            // Kemas kini data lokal
            currentUser.name = name;
            currentUser.phone = phone;
            currentUser.address = address;
            currentUser.avatar_url = avatar_url;
            
            // Refresh paparan akaun
            document.getElementById("acc-name").innerText = name || currentUser.username;
            document.getElementById("acc-phone").innerText = phone;
            if(avatar_url) {
                let showUrl = avatar_url;
                if(showUrl.startsWith("./Profile/")) showUrl = showUrl.substring(1);
                document.getElementById("acc-avatar").src = showUrl;
            }
            
            switchView("account");
        } else {
            alert(data.message || "Gagal mengemas kini profil.");
        }
    } catch(err) {
        alert("Ralat pelayan. Sila cuba sebentar lagi.");
    }
    
    btn.innerText = origText;
    btn.disabled = false;
}
`;

js = js + editProfileFunc;

fs.writeFileSync('public/customer/js/customer.js', js);
console.log("Added handleEditProfile");
