const fs = require('fs');
let content = fs.readFileSync('public/staff/js/staff.js', 'utf8');

const hideBonusCode = `
  if (bonesElement) {
    if (staffData.status_pekerja === 'part_time') {
      bonesElement.closest('.dash-card').style.display = 'none';
    } else {
      bonesElement.innerText = \`RM \${bones.toFixed(0)}\`;
      bonesElement.closest('.dash-card').style.display = 'flex'; // or whatever the default is
    }
  }
`;

content = content.replace(/const bonesElement = document\.getElementById\("dash-bones"\);\s*if \(bonesElement\) \{\s*bonesElement\.innerText = `RM \$\{bones\.toFixed\(0\)\}`;\s*\}/, 'const bonesElement = document.getElementById("dash-bones");\n' + hideBonusCode);

fs.writeFileSync('public/staff/js/staff.js', content);
console.log("Updated staff.js for part_time bonus hiding.");
