const fs = require('fs');
let js = fs.readFileSync('public/js/index.js', 'utf8');
const deadFunc = /function handleEditProfileAvatar\(input\) \{\s*if \(input\.files && input\.files\[0\]\) \{\s*compressImage\(input\.files\[0\], \(base64\) => \{\s*document\.getElementById\("edit-profile-avatar-preview"\)\.src = base64;\s*document\.getElementById\("edit-profile-avatar-val"\)\.value = base64;\s*\}\);\s*\}\s*\}/;
js = js.replace(deadFunc, "");
fs.writeFileSync('public/js/index.js', js);
