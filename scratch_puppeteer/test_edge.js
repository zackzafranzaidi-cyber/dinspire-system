const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const edgeDir = process.env.LOCALAPPDATA + '\\Microsoft\\Edge\\User Data';
    
    let browser;
    try {
        browser = await puppeteer.launch({
            executablePath: edgePath,
            userDataDir: edgeDir,
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.goto('https://supabase.com/dashboard/projects', { waitUntil: 'networkidle2' });
        
        // Extract token
        const tokenStr = await page.evaluate(() => {
            for(let i=0; i<localStorage.length; i++) {
                let key = localStorage.key(i);
                if (key && key.includes('supabase.auth.token')) {
                    return localStorage.getItem(key);
                }
            }
            // fallback for management token if different
            let allLocal = {};
            for(let i=0; i<localStorage.length; i++) {
                allLocal[localStorage.key(i)] = localStorage.getItem(localStorage.key(i));
            }
            return JSON.stringify(allLocal);
        });
        
        fs.writeFileSync('edge_token.txt', tokenStr || 'NOT_FOUND');
        console.log("Edge done");
        await browser.close();
    } catch (e) {
        console.error("Edge error:", e.message);
        if (browser) await browser.close();
    }
})();
