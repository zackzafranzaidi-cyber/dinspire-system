const fs = require('fs');
let html = fs.readFileSync('public/customer/index.html', 'utf8');

// 1. Remove Activity List
const regexActivityList = /<!-- Review Section Moved to Modal -->\s*<div style="padding: 0">\s*<div class="section-title" style="margin-left: 0" data-i18n="account-activities">\s*Your Activity List\s*<\/div>\s*<div id="bookings-list-container"><\/div>\s*<\/div>/;
html = html.replace(regexActivityList, "");

// 2. Change Avatar to Barber Pole
const regexAvatar = /<img\s*id="profile-avatar"\s*alt="Profile Avatar"\s*src=""\s*style="[^"]*"\s*\/>/;
const newAvatar = `
                <div class="barber-pole-wrapper">
                  <img id="profile-avatar" alt="Profile Avatar" src="" />
                </div>`;
html = html.replace(regexAvatar, newAvatar);

// 3. Add Edit Profile Button
const regexLogout = /<button\s*type="button"\s*id="logout-btn"\s*class="submit-btn"[\s\S]*?<\/button>/;
const editBtnAndLogout = `
                <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
                  <button
                    type="button"
                    class="submit-btn"
                    style="background: #f8fafc; color: #111827; width: 100%; box-shadow: 0 4px 12px rgba(0,0,0,0.05); font-weight: bold; border: 1px solid #E5E5EA; border-radius: 12px;"
                    onclick="openEditProfileModal()"
                  >
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    id="logout-btn"
                    class="submit-btn"
                    style="background: #ffffff; color: #ff2a2a; width: 100%; box-shadow: 0 4px 12px rgba(0,0,0,0.08); font-weight: bold; border: none; border-radius: 12px;"
                    data-i18n="account-btn-logout"
                  >
                    Logout
                  </button>
                </div>
`;
html = html.replace(regexLogout, editBtnAndLogout);

// 4. Add Edit Profile Modal
const editProfileModal = `
    <!-- Edit Profile Modal -->
    <div id="edit-profile-modal" class="modal-overlay">
      <div class="modal-content" style="max-width: 400px; padding: 20px;">
        <div class="modal-header">
          <h2 style="font-size:18px; font-weight:bold;">Edit Profile</h2>
          <button type="button" class="close-btn" onclick="closeModal('edit-profile-modal')">&times;</button>
        </div>
        <div class="modal-body" style="padding-top:10px;">
          <form id="form-edit-profile">
            <div style="text-align:center; margin-bottom:15px;">
              <img id="edit-profile-avatar-preview" src="" style="width:70px; height:70px; border-radius:50%; object-fit:cover; border:2px solid #E5E5EA; margin-bottom:10px;">
              <br>
              <button type="button" class="submit-btn" style="padding: 6px 12px; font-size:12px; border-radius:6px;" onclick="document.getElementById('edit-profile-file').click()">Tukar Gambar</button>
              <input type="file" id="edit-profile-file" accept="image/*" style="display:none;" onchange="handleEditProfileAvatar(this)">
              <input type="hidden" id="edit-profile-avatar-val">
            </div>
            
            <div class="form-group">
              <label style="font-size:13px; font-weight:600; color:#374151; margin-bottom:4px; display:block;">Nama</label>
              <input type="text" id="edit-profile-name" class="input-field" required>
            </div>
            <div class="form-group">
              <label style="font-size:13px; font-weight:600; color:#374151; margin-bottom:4px; display:block;">No Telefon</label>
              <input type="tel" id="edit-profile-phone" class="input-field" required>
            </div>
            <div class="form-group">
              <label style="font-size:13px; font-weight:600; color:#374151; margin-bottom:4px; display:block;">Alamat Default</label>
              <textarea id="edit-profile-address" class="input-field" rows="3" style="border-radius:12px; resize:none;"></textarea>
            </div>
            
            <button type="submit" id="btn-edit-profile-submit" class="submit-btn" style="margin-top:15px;">Simpan Perubahan</button>
          </form>
        </div>
      </div>
    </div>
`;

// Insert modal before </body>
html = html.replace('</body>', editProfileModal + '\n</body>');

fs.writeFileSync('public/customer/index.html', html);
console.log("Updated HTML with barber pole, buttons, and modal.");
