const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data', 'Default', 'Local Storage', 'leveldb');
const destDir = path.join(__dirname, 'temp_leveldb');

if (!fs.existsSync(destDir)) fs.mkdirSync(destDir);

const files = fs.readdirSync(srcDir);
for (const file of files) {
    try {
        fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
    } catch(e) {
        console.log("Could not copy " + file + " - " + e.message);
    }
}
console.log("Copy complete");
