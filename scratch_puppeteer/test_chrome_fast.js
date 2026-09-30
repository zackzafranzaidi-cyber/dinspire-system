const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const chromeDir = process.env.LOCALAPPDATA + '\\Google\\Chrome\\User Data';
    
    let browser;
    try {
        browser = await puppeteer.launch({
            executablePath: chromePath,
            userDataDir: chromeDir,
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.goto('https://supabase.com/dashboard/projects', { waitUntil: 'domcontentloaded' });
        
        // Wait 5 seconds to ensure localStorage is fully loaded by their React app
        await new Promise(r => setTimeout(r, 5000));
        
        // Extract token
        const tokenStr = await page.evaluate(() => {
            let allLocal = {};
            for(let i=0; i<localStorage.length; i++) {
                allLocal[localStorage.key(i)] = localStorage.getItem(localStorage.key(i));
            }
            return JSON.stringify(allLocal);
        });
        
        fs.writeFileSync('chrome_token.txt', tokenStr || 'NOT_FOUND');
        console.log("Chrome done");
        await browser.close();
    } catch (e) {
        console.error("Chrome error:", e.message);
        if (browser) await browser.close();
    }
})();
