const fs = require('fs');
let html = fs.readFileSync('public/customer/index.html', 'utf8');

// 1. Extract the view-edit-profile block
const viewEditProfileRegex = /<!-- Edit Profile Full View -->[\s\S]*?<\/form>\s*<\/div>\s*<\/div>/;
const match = html.match(viewEditProfileRegex);
if (!match) {
    console.log("Could not find view-edit-profile block");
    process.exit(1);
}
const viewEditProfileHTML = match[0];

// 2. Remove it from its current position
html = html.replace(viewEditProfileHTML, '');

// 3. Find the end of view-account
// We need to find: 
// <button type="button" id="logout-btn" ...> Logout </button>
// </div>
// </div>
// </div>
const targetPattern = /Logout\s*<\/button>\s*<\/div>\s*<\/div>\s*<\/div>/;

if (targetPattern.test(html)) {
    html = html.replace(targetPattern, `$& \n\n ${viewEditProfileHTML}`);
    fs.writeFileSync('public/customer/index.html', html);
    console.log("Moved view-edit-profile inside view-content");
} else {
    console.log("Could not find target insertion point");
}
