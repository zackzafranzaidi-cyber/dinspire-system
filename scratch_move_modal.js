const fs = require('fs');
let html = fs.readFileSync('public/customer/index.html', 'utf8');

// 1. Extract the entire edit-profile-modal block
const startTag = '<!-- Edit Profile Modal -->';
const endTag = '</div>\n\n</body>';

const startIndex = html.indexOf(startTag);
const endIndex = html.lastIndexOf('</div>', html.lastIndexOf('</body>'));

const modalHTML = html.substring(startIndex, endIndex + 6) + '\n';

// 2. Remove it from the bottom
html = html.substring(0, startIndex) + '\n</body>\n</html>';

// 3. Insert it right after avatar-modal-overlay ends
const avatarModalStart = html.indexOf('<div class="custom-modal-overlay" id="avatar-modal-overlay"');
// Find the end of avatar-modal-overlay
// It looks like:
// <div class="custom-modal-overlay" id="avatar-modal-overlay"...>
//   <div class="custom-modal">
//     ...
//   </div>
// </div>
// Just insert it right BEFORE the avatar-modal-overlay to be safe? No, AFTER it. 
// Actually, inserting it right before avatar-modal-overlay is perfectly fine, since we gave avatar-modal-overlay a z-index of 400.
// Let's just put it BEFORE avatar-modal-overlay.

html = html.substring(0, avatarModalStart) + modalHTML + html.substring(avatarModalStart);

fs.writeFileSync('public/customer/index.html', html);
console.log("Moved edit-profile-modal inside mobile-container alongside avatar-modal-overlay.");
