const fs = require('fs');
let html = fs.readFileSync('public/customer/index.html', 'utf8');

// 1. Remove the modal HTML completely
const modalRegex = /<!-- Edit Profile Modal -->[\s\S]*?<div class="custom-modal-overlay" id="avatar-modal-overlay"/;
html = html.replace(modalRegex, '<div class="custom-modal-overlay" id="avatar-modal-overlay"');

// 2. Insert it as a new view after <div id="view-account" ...
const accountViewEndRegex = /<div id="view-account" class="view-section">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

const newViewHTML = `
        <!-- Edit Profile Full View -->
        <div id="view-edit-profile" class="view-section" style="background: var(--bg-main);">
          <div class="header" style="justify-content: flex-start; gap: 15px;">
            <button onclick="switchView('account')" style="background:none; border:none; color:var(--text-main); font-size:20px; cursor:pointer;"><i class="fas fa-arrow-left"></i></button>
            <h1 style="font-size: 20px;">Edit Profile</h1>
          </div>
          
          <div style="padding: 20px;">
            <form id="form-edit-profile">
              <div style="text-align:center; margin-bottom:20px;">
                <img id="edit-profile-avatar-preview" src="" style="width:100px; height:100px; border-radius:50%; object-fit:cover; border:2px solid #E5E5EA; margin-bottom:15px;">
                <br>
                <button type="button" class="submit-btn" style="padding: 8px 16px; font-size:14px; border-radius:8px;" onclick="openAvatarModal()">Tukar Gambar</button>
                <input type="hidden" id="edit-profile-avatar-val">
              </div>
              
              <div class="form-group" style="margin-bottom: 20px;">
                <label style="font-size:14px; font-weight:600; color: var(--text-main); margin-bottom:8px; display:block;">Nama</label>
                <input type="text" id="edit-profile-name" class="input-field" required>
              </div>
              <div class="form-group" style="margin-bottom: 20px;">
                <label style="font-size:14px; font-weight:600; color: var(--text-main); margin-bottom:8px; display:block;">No Telefon</label>
                <input type="tel" id="edit-profile-phone" class="input-field" required>
              </div>
              <div class="form-group" style="margin-bottom: 25px;">
                <label style="font-size:14px; font-weight:600; color: var(--text-main); margin-bottom:8px; display:block;">Alamat Default</label>
                <textarea id="edit-profile-address" class="input-field" rows="4" style="border-radius:12px; resize:none;"></textarea>
              </div>
              
              <button type="submit" id="btn-edit-profile-submit" class="submit-btn" style="width: 100%; margin-bottom: 15px;">Simpan Perubahan</button>
              
              <button type="button" onclick="deleteCustomerAccount()" class="submit-btn" style="width: 100%; background: transparent; color: #EF4444; border: 1px solid #EF4444; box-shadow: none;">Padam Akaun</button>
            </form>
          </div>
        </div>
`;

// To insert after view-account, we just replace the end of view-account with itself + new view
html = html.replace(/(<div id="view-account" class="view-section">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>)/, `$1\n${newViewHTML}`);

// 3. Update the button to switchView instead of openEditProfileModal
html = html.replace(/onclick="openEditProfileModal\(\)"/g, `onclick="switchView('edit-profile')"`);

fs.writeFileSync('public/customer/index.html', html);
console.log("Moved edit profile to view");
