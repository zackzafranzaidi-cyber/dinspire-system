const fs = require('fs');
const swFiles = ['public/customer/sw.js', 'public/staff/sw.js', 'public/owner/sw.js'];
swFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/CACHE_NAME\s*=\s*['"]dinspire-pwa-v(\d+)['"]/g, (match, p1) => {
      const nextVersion = parseInt(p1, 10) + 1;
      return `CACHE_NAME = 'dinspire-pwa-v${nextVersion}'`;
    });
    fs.writeFileSync(file, content);
    console.log('Bumped', file);
  }
});
