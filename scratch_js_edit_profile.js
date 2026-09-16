const fs = require('fs');
let js = fs.readFileSync('public/js/index.js', 'utf8');

const jsInjection = `
function openEditProfileModal() {
  if (!currentUser) return;
  document.getElementById("edit-profile-name").value = currentUser.name || currentUser.username || "";
  document.getElementById("edit-profile-phone").value = currentUser.phone || "";
  document.getElementById("edit-profile-address").value = currentUser.address || "";
  
  let avatarUrl = currentUser.avatar_url || "https://via.placeholder.com/150";
  if (avatarUrl.startsWith("./Profile/")) {
    avatarUrl = avatarUrl.substring(1);
  }
  
  document.getElementById("edit-profile-avatar-preview").src = avatarUrl;
  document.getElementById("edit-profile-avatar-val").value = currentUser.avatar_url || "";
  
  document.getElementById("edit-profile-modal").classList.add("active");
}

function handleEditProfileAvatar(input) {
  if (input.files && input.files[0]) {
    compressImage(input.files[0], (base64) => {
      document.getElementById("edit-profile-avatar-preview").src = base64;
      document.getElementById("edit-profile-avatar-val").value = base64;
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const formEditProfile = document.getElementById("form-edit-profile");
  if (formEditProfile) {
    formEditProfile.addEventListener("submit", function(e) {
      e.preventDefault();
      const name = document.getElementById("edit-profile-name").value.trim();
      const phone = document.getElementById("edit-profile-phone").value.trim();
      const address = document.getElementById("edit-profile-address").value.trim();
      const avatar_url = document.getElementById("edit-profile-avatar-val").value;
      
      const btn = document.getElementById("btn-edit-profile-submit");
      const oldText = btn.innerText;
      btn.innerText = "Menyimpan...";
      btn.disabled = true;
      
      fetch(\`\${API_BASE_URL}/auth/profile\`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, address, avatar_url })
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          currentUser = data.user;
          localStorage.setItem("din_customer_session", JSON.stringify(currentUser));
          
          document.getElementById("profile-name").innerText = escapeHTML(currentUser.name || currentUser.username);
          document.getElementById("profile-phone").innerText = escapeHTML(currentUser.phone);
          
          let finalAvatar = currentUser.avatar_url || "https://via.placeholder.com/60";
          if (finalAvatar.startsWith("./Profile/")) finalAvatar = finalAvatar.substring(1);
          document.getElementById("profile-avatar").src = escapeHTML(finalAvatar);
          
          closeModal("edit-profile-modal");
          alert(data.message);
        } else {
          alert("Ralat: " + data.message);
        }
      })
      .catch(err => alert("Ralat pelayan."))
      .finally(() => {
        btn.innerText = oldText;
        btn.disabled = false;
      });
    });
  }
});
`;

js += jsInjection;
fs.writeFileSync('public/js/index.js', js);
console.log("Injected Edit Profile logic.");
