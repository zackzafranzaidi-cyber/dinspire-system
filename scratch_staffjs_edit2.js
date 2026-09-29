const fs = require('fs');
let content = fs.readFileSync('routes/staff.js', 'utf8');

const regex = /try \{\n\s*const \{ data: owners \} = await supabase[\s\S]*?\} catch\(e\) \{\}/;

const newNotify = `try {
        await notifyOwner('Permohonan Edit Transaksi 📝', \`\${req.user.username} memohon untuk edit harga ke RM\${new_price}. Sila semak.\`, '/owner/index.html');
    } catch(e) { console.error(e); }`;

content = content.replace(regex, newNotify);
fs.writeFileSync('routes/staff.js', content);
console.log("Updated staff.js push notification");
