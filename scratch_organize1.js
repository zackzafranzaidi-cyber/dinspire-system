const fs = require('fs');
const path = require('path');

function moveFile(src, dest) {
    if (fs.existsSync(src)) {
        const destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        fs.renameSync(src, dest);
        console.log(`Moved: ${src} -> ${dest}`);
    }
}

// 1. Move CSS files
moveFile('public/css/index.css', 'public/customer/css/index.css');
moveFile('public/css/loader.css', 'public/customer/css/loader.css');
moveFile('public/css/owner.css', 'public/owner/css/owner.css');
moveFile('public/css/owner_cms.css', 'public/owner/css/owner_cms.css');
moveFile('public/css/admin.css', 'public/owner/css/admin.css');
moveFile('public/css/admin_backup.css', 'public/owner/css/admin_backup.css');
moveFile('public/css/staff.css', 'public/staff/css/staff.css');

// 2. Move JS files
moveFile('public/js/index.js', 'public/customer/js/index.js');
moveFile('public/js/i18n-index.js', 'public/customer/js/i18n-index.js');
moveFile('public/js/owner.js', 'public/owner/js/owner.js');
moveFile('public/js/owner_cms.js', 'public/owner/js/owner_cms.js');
moveFile('public/js/admin.js', 'public/owner/js/admin.js');
moveFile('public/js/admin_backup.js', 'public/owner/js/admin_backup.js');
moveFile('public/js/staff.js', 'public/staff/js/staff.js');

// Optional: delete empty directories
if (fs.existsSync('public/css') && fs.readdirSync('public/css').length === 0) fs.rmdirSync('public/css');
if (fs.existsSync('public/js') && fs.readdirSync('public/js').length === 0) fs.rmdirSync('public/js');

// 3. Update HTML Files
function replaceInFile(filePath, replacements) {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        for (const r of replacements) {
            const before = content;
            content = content.replace(r.search, r.replace);
            if (before !== content) modified = true;
        }
        if (modified) {
            fs.writeFileSync(filePath, content);
            console.log(`Updated: ${filePath}`);
        }
    }
}

// Customer HTML
replaceInFile('public/customer/index.html', [
    { search: /\/css\/index\.css/g, replace: './css/index.css' },
    { search: /\/css\/loader\.css/g, replace: './css/loader.css' },
    { search: /\/js\/index\.js/g, replace: './js/index.js' },
    { search: /\/js\/i18n-index\.js/g, replace: './js/i18n-index.js' }
]);

// Owner HTML
replaceInFile('public/owner/index.html', [
    { search: /\/css\/owner\.css/g, replace: './css/owner.css' },
    { search: /\/css\/owner_cms\.css/g, replace: './css/owner_cms.css' },
    { search: /\/css\/loader\.css/g, replace: './css/loader.css' },
    { search: /\/js\/owner\.js/g, replace: './js/owner.js' },
    { search: /\/js\/owner_cms\.js/g, replace: './js/owner_cms.js' }
]);
replaceInFile('public/owner/archive-download.html', [
    { search: /\/css\/owner\.css/g, replace: './css/owner.css' }
]);

// Staff HTML
replaceInFile('public/staff/index.html', [
    { search: /\/css\/staff\.css/g, replace: './css/staff.css' },
    { search: /\/css\/loader\.css/g, replace: './css/loader.css' },
    { search: /\/js\/staff\.js/g, replace: './js/staff.js' }
]);

// 4. Update Service Workers
replaceInFile('public/customer/sw.js', [
    { search: /'\/css\//g, replace: "'/customer/css/" },
    { search: /'\/js\//g, replace: "'/customer/js/" },
    // Remove owner and staff from customer sw!
    { search: /,\s*'\/?css\/staff\.css'/g, replace: '' },
    { search: /,\s*'\/?js\/staff\.js'/g, replace: '' },
    { search: /,\s*'\/?css\/owner\.css'/g, replace: '' },
    { search: /,\s*'\/?js\/owner\.js'/g, replace: '' },
    { search: /dinspire-pwa-v\d+/g, replace: 'dinspire-pwa-v22' } // bump cache
]);

replaceInFile('public/owner/sw.js', [
    { search: /'\.\.\/css\//g, replace: "'./css/" },
    { search: /'\.\.\/js\//g, replace: "'./js/" },
    { search: /dinspire-owner-v\d+/g, replace: 'dinspire-owner-v22' }
]);

replaceInFile('public/staff/sw.js', [
    { search: /'\.\.\/css\//g, replace: "'./css/" },
    { search: /'\.\.\/js\//g, replace: "'./js/" },
    { search: /dinspire-staff-v\d+/g, replace: 'dinspire-staff-v22' }
]);

// Customer SW has paths like '/css/index.css' or './css/index.css'.
// Because customer is mounted at `/`, actually './css/index.css' is cached.
// Wait, in customer/sw.js I replaced `'/css/` with `'/customer/css/`. No!
// Customer is mounted at `/`, so it fetches from `/css/index.css` normally (wait, no, we just changed index.html to use `./css/index.css`).
// So the fetched URL will be `/css/index.css`.
// Let's rewrite customer/sw.js properly!
