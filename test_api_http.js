const http = require('http');

http.get('http://localhost:3000/api/staff/lookup-phone?phone=0123456789', (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        console.log("Status:", res.statusCode);
        console.log("Response:", rawData);
    });
}).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
});
