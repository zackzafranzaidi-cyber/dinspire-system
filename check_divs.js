const fs = require('fs');
const html = fs.readFileSync('public/customer/index.html', 'utf8');

const accountIdx = html.indexOf('<div id="view-account"');
const editProfileIdx = html.indexOf('<div id="view-edit-profile"');

console.log("Account starts at:", accountIdx);
console.log("Edit Profile starts at:", editProfileIdx);

// Count divs between them
let textBetween = html.substring(accountIdx, editProfileIdx);
let openDivs = (textBetween.match(/<div/g) || []).length;
let closeDivs = (textBetween.match(/<\/div>/g) || []).length;

console.log("Open divs:", openDivs);
console.log("Close divs:", closeDivs);
console.log("Difference:", openDivs - closeDivs);

// Look at the end of the file
const afterEditProfile = html.substring(editProfileIdx);
let openDivsAfter = (afterEditProfile.match(/<div/g) || []).length;
let closeDivsAfter = (afterEditProfile.match(/<\/div>/g) || []).length;

console.log("Open divs after:", openDivsAfter);
console.log("Close divs after:", closeDivsAfter);
console.log("Difference after:", openDivsAfter - closeDivsAfter);

