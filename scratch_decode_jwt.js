const tokens = require('fs').readFileSync('all_jwts.txt', 'utf8').split('\n');
for (let t of tokens) {
    if (t.trim()) {
        try {
            const payload = JSON.parse(Buffer.from(t.split('.')[1], 'base64').toString());
            if (payload.exp > Date.now() / 1000) {
                console.log("Valid token payload:", JSON.stringify(payload));
                console.log("Token:", t);
            }
        } catch(e) {}
    }
}
