const bcrypt = require('bcryptjs');

async function janaHash() {
    const passwordTeks = '123456';
    const hash = await bcrypt.hash(passwordTeks, 10);
    
    console.log(`\n========================================`);
    console.log(`Sila salin kod hash di bawah ini:`);
    console.log(`\n${hash}\n`);
    console.log(`========================================\n`);
}

janaHash();