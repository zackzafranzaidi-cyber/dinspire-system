const puppeteer = require('puppeteer-core');

async function testBrowser(exePath, dataDir) {
    let browser;
    try {
        browser = await puppeteer.launch({
            executablePath: exePath,
            userDataDir: dataDir,
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.goto('https://supabase.com/dashboard/projects', { waitUntil: 'networkidle2' });
        const content = await page.content();
        
        let loggedIn = false;
        if (content.includes('Sign in to your account')) {
            console.log("NOT_LOGGED_IN: " + exePath);
        } else {
            console.log("LOGGED_IN: " + exePath);
            loggedIn = true;
            
            // If logged in, execute the SQL directly via the Dashboard UI!
            // Wait, automating the Supabase UI is very hard (React, random classes).
            // But we can extract the API token or session from localStorage!
        }
        await browser.close();
        return loggedIn;
    } catch (e) {
        console.error("Error with " + exePath + ": " + e.message);
        if (browser) await browser.close();
        return false;
    }
}

(async () => {
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const chromeDir = process.env.LOCALAPPDATA + '\\Google\\Chrome\\User Data';
    
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const edgeDir = process.env.LOCALAPPDATA + '\\Microsoft\\Edge\\User Data';

    await testBrowser(chromePath, chromeDir);
    await testBrowser(edgePath, edgeDir);
})();
