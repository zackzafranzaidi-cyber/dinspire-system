const fs = require('fs');
const html = fs.readFileSync('public/customer/index.html', 'utf8');

const accountIdx = html.indexOf('<div id="view-account"');
const editProfileIdx = html.indexOf('<div id="view-edit-profile"');

let beforeAccount = html.substring(0, accountIdx);
let openBefore = (beforeAccount.match(/<div/g) || []).length;
let closeBefore = (beforeAccount.match(/<\/div>/g) || []).length;

console.log("Net open divs before view-account:", openBefore - closeBefore);

let accountToEdit = html.substring(accountIdx, editProfileIdx);
let openBetween = (accountToEdit.match(/<div/g) || []).length;
let closeBetween = (accountToEdit.match(/<\/div>/g) || []).length;

console.log("Net divs inside view-account before view-edit-profile:", openBetween - closeBetween);
