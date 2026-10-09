const jwt = require('jsonwebtoken');

// Look up secret from .env if possible
require('dotenv').config();

const payload = { id: 1, role: 'owner', username: 'Owner' };
const token = jwt.sign(payload, process.env.JWT_SECRET_SYS || 'rahsia_sistem_dinspire_123', { expiresIn: '1h' });

async function checkApi() {
    console.log("Calling API...");
    try {
        const res = await fetch('http://localhost:3000/api/staff/lookup-phone?phone=0123456789', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        console.log("Response:", data);
    } catch(e) {
        console.log("Error:", e);
    }
}
checkApi();
