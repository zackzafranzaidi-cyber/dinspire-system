const fs = require('fs');
const content = fs.readFileSync('public/js/owner_cms.js', 'utf8');
const lines = content.split('\n');

const startIdx = lines.findIndex(l => l.includes('function renderProducts(dataArr, container) {'));
let endIdx = -1;
if (startIdx !== -1) {
    for (let i = startIdx + 1; i < lines.length; i++) {
        if (lines[i].startsWith('}')) {
            endIdx = i;
            break;
        }
    }
}

if (startIdx !== -1 && endIdx !== -1) {
    lines.splice(startIdx, endIdx - startIdx + 1);
    fs.writeFileSync('public/js/owner_cms.js', lines.join('\n'));
    console.log("Deleted renderProducts");
} else {
    console.log("Could not find renderProducts");
}
