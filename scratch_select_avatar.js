const fs = require('fs');
let js = fs.readFileSync('public/js/index.js', 'utf8');

const regexSelectAvatar = /function selectAvatar\(imgEl, path\) \{\s*document\s*\.querySelectorAll\("\.avatar-grid img"\)\s*\.forEach\(\(el\) => el\.classList\.remove\("selected"\)\);\s*imgEl\.classList\.add\("selected"\);\s*document\.getElementById\("reg-avatar-val"\)\.value = path;\s*document\.getElementById\("reg-avatar-preview"\)\.src = path;\s*\}/;

const newSelectAvatar = `function selectAvatar(imgEl, path) {
    document.querySelectorAll(".avatar-grid img").forEach((el) => el.classList.remove("selected"));
    imgEl.classList.add("selected");
    
    // Check if Edit Profile modal is active
    const editModal = document.getElementById("edit-profile-modal");
    if (editModal && editModal.classList.contains("active")) {
      document.getElementById("edit-profile-avatar-val").value = path;
      document.getElementById("edit-profile-avatar-preview").src = path;
      closeModal("avatar-modal-overlay");
    } else {
      document.getElementById("reg-avatar-val").value = path;
      document.getElementById("reg-avatar-preview").src = path;
    }
  }`;

js = js.replace(regexSelectAvatar, newSelectAvatar);
fs.writeFileSync('public/js/index.js', js);
console.log("Updated selectAvatar function.");
