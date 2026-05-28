const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    try {
        await page.goto('http://localhost:5173/graphs', {waitUntil: 'networkidle0', timeout: 8000});
    } catch(e) {
        console.log("NAV ERROR: ", e.message);
    }
    await browser.close();
})();
