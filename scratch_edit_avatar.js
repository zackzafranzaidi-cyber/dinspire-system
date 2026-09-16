const fs = require('fs');
let html = fs.readFileSync('public/customer/index.html', 'utf8');

const regexInputFile = /<button type="button" class="submit-btn" style="padding: 6px 12px; font-size:12px; border-radius:6px;" onclick="document\.getElementById\('edit-profile-file'\)\.click\(\)">Tukar Gambar<\/button>\s*<input type="file" id="edit-profile-file" accept="image\/\*" style="display:none;" onchange="handleEditProfileAvatar\(this\)">/;

const replacementInputFile = '<button type="button" class="submit-btn" style="padding: 6px 12px; font-size:12px; border-radius:6px;" onclick="openAvatarModal()">Tukar Gambar</button>';

html = html.replace(regexInputFile, replacementInputFile);

// Change barber pole wrapper to elegant border wrapper
const regexBarberHTML = /<div class="barber-pole-wrapper">/;
html = html.replace(regexBarberHTML, '<div class="profile-avatar-wrapper">');

fs.writeFileSync('public/customer/index.html', html);
console.log("Updated HTML with avatar modal button and elegant wrapper class.");
