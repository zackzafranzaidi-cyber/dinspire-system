const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
    try {
        console.log("Launching chrome with user data...");
        const browser = await puppeteer.launch({
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            userDataDir: process.env.LOCALAPPDATA + '\\Google\\Chrome\\User Data',
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.goto('https://supabase.com/dashboard/projects', { waitUntil: 'networkidle2' });
        const content = await page.content();
        if (content.includes('Sign in to your account')) {
            console.log("NOT_LOGGED_IN");
        } else {
            console.log("LOGGED_IN");
        }
        await browser.close();
    } catch (e) {
        console.error("Chrome error:", e.message);
    }
})();
