const fs = require('fs');
function bumpCache(file) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/(CACHE_NAME\s*=\s*['"][\w-]+-v)(\d+)(['"])/, (match, p1, p2, p3) => {
        return p1 + (parseInt(p2) + 1) + p3;
    });
    fs.writeFileSync(file, content);
}
bumpCache('public/customer/sw.js');

function bumpQueryStrings(file) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\?v=(\d+)/g, (match, p1) => {
        return '?v=' + (parseInt(p1) + 1);
    });
    content = content.replace(/CURRENT_APP_VERSION = "(\d+\.\d+\.)(\d+)"/, (match, p1, p2) => {
        return 'CURRENT_APP_VERSION = "' + p1 + (parseInt(p2) + 1) + '"';
    });
    fs.writeFileSync(file, content);
}
bumpQueryStrings('public/customer/index.html');
