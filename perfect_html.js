const fs = require('fs');
let html = fs.readFileSync('public/customer/index.html', 'utf8');

// 1. Remove the old Edit Profile Modal
const modalRegex = /<!-- Edit Profile Modal -->[\s\S]*?<div class="custom-modal-overlay" id="avatar-modal-overlay"/;
html = html.replace(modalRegex, '<div class="custom-modal-overlay" id="avatar-modal-overlay"');

// 2. Find the closing tag of view-account
// view-account starts at:
const accountStartIdx = html.indexOf('<div id="view-account" class="view-section">');
if (accountStartIdx === -1) throw new Error("Could not find view-account");

// We will parse forward, counting <div and </div
let openDivs = 0;
let currentIndex = accountStartIdx;
let foundEnd = false;

while (currentIndex < html.length) {
    let nextOpen = html.indexOf('<div', currentIndex);
    let nextClose = html.indexOf('</div', currentIndex);

    if (nextOpen !== -1 && nextOpen < nextClose) {
        openDivs++;
        currentIndex = nextOpen + 4;
    } else if (nextClose !== -1) {
        openDivs--;
        currentIndex = nextClose + 6; // length of '</div>'
        if (openDivs === 0) {
            foundEnd = true;
            break;
        }
    } else {
        break; // Should not happen if well-formed
    }
}

if (!foundEnd) {
    throw new Error("Could not find closing tag for view-account");
}

const insertionPoint = currentIndex;

// 3. Create the new view-edit-profile HTML
const newViewHTML = `
        <!-- Edit Profile Full View -->
        <div id="view-edit-profile" class="view-section" style="background: var(--bg-main); padding-top: 20px;">
          <div class="header" style="justify-content: flex-start; gap: 15px; border-bottom: 1px solid #333; padding-bottom: 15px; background: var(--bg-main);">
            <button type="button" onclick="switchView('account')" style="background:none; border:none; color:var(--text-main); font-size:20px; cursor:pointer;"><i class="fas fa-arrow-left"></i></button>
            <h1 style="font-size: 20px; margin: 0; padding: 0;">Edit Profile</h1>
          </div>
          
          <div style="padding: 20px; padding-bottom: 100px;">
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

// Insert it!
html = html.slice(0, insertionPoint) + '\n' + newViewHTML + '\n' + html.slice(insertionPoint);

// Update button action
html = html.replace(/onclick="openEditProfileModal\(\)"/g, `onclick="switchView('edit-profile')"`);

fs.writeFileSync('public/customer/index.html', html);
console.log("HTML completely fixed!");
