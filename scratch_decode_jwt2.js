const tokens = require('fs').readFileSync('all_jwts.txt', 'utf8').split('\n');
for (let t of tokens) {
    if (t.trim()) {
        try {
            const payload = JSON.parse(Buffer.from(t.split('.')[1], 'base64').toString());
            console.log("Payload:", JSON.stringify(payload));
        } catch(e) {}
    }
}
