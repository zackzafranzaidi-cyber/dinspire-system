const fs = require('fs');
let js = fs.readFileSync('public/customer/js/customer.js', 'utf8');

// Remove openEditProfileModal and its content up to display='flex'
const openModalRegex = /function openEditProfileModal\(\) \{[\s\S]*?document\.getElementById\("edit-profile-modal"\)\.style\.display = "flex";\s*\}/;
js = js.replace(openModalRegex, '');

// Inject populate logic into switchView
const switchViewRegex = /document\.getElementById\("view-" \+ id\)\?\.classList\.add\("active"\);/;
const switchViewInject = `document.getElementById("view-" + id)?.classList.add("active");
    if (id === "edit-profile") {
      if (!currentUser) {
        hideGlobalLoader();
        return switchView("account");
      }
      document.getElementById("edit-profile-name").value = currentUser.name || currentUser.username || "";
      document.getElementById("edit-profile-phone").value = currentUser.phone || "";
      document.getElementById("edit-profile-address").value = currentUser.address || "";
      let avatarUrl = currentUser.avatar_url || "/Profile/1.png";
      if (avatarUrl.startsWith("./Profile/")) avatarUrl = avatarUrl.substring(1);
      document.getElementById("edit-profile-avatar-preview").src = avatarUrl;
      document.getElementById("edit-profile-avatar-val").value = currentUser.avatar_url || "";
    }`;
js = js.replace(switchViewRegex, switchViewInject);

// Add deleteCustomerAccount function
const deleteFunc = `
async function deleteCustomerAccount() {
    if (!confirm("Adakah anda pasti mahu memadamkan akaun anda? Tindakan ini tidak boleh diundur.")) return;
    
    showGlobalLoader();
    try {
        const res = await fetch(API_BASE_URL + "/auth/profile", {
            method: "DELETE",
            credentials: "include"
        });
        const data = await res.json();
        hideGlobalLoader();
        if (data.status === "success") {
            alert("Akaun anda telah dipadamkan.");
            logoutUser();
        } else {
            alert(data.message || "Gagal memadam akaun.");
        }
    } catch(e) {
        hideGlobalLoader();
        alert("Ralat pelayan.");
    }
}
`;
js = js + deleteFunc;

fs.writeFileSync('public/customer/js/customer.js', js);
console.log("Updated customer.js");
