const fs = require('fs');
const content = fs.readFileSync('routes/staff.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('from("staff")')) {
    console.log(i, line);
  }
});
