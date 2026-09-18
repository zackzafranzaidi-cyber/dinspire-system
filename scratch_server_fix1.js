const fs = require('fs');
let js = fs.readFileSync('server.js', 'utf8');

const targetStr = `    // Padam semua cuti yang berlalu (sebelum bulan semasa)
    const { error } = await supabase.from("staff_leaves").delete().lt("tarikh", firstDayThisMonth);`;

const fixStr = `    // [DIBAIKI] Padam cuti yang berlalu melebihi 1 tahun (supaya Owner masih boleh lihat rekod tahunan)
    const lastYear = new Date(myTime.getFullYear() - 1, myTime.getMonth(), 1).toISOString().split('T')[0];
    const { error } = await supabase.from("staff_leaves").delete().lt("tarikh", lastYear);`;

js = js.replace(targetStr, fixStr);
fs.writeFileSync('server.js', js);
console.log('Fixed staff_leaves aggressive deletion');
