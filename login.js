const puppeteer = require('puppeteer');

async function login() {
    // Start a headless browser
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Replace the URL with the login page URL
    await page.goto('https://go.utah.edu/cas/login?TARGET=https%3A%2F%2Fportal.app.utah.edu%2Fapi-proxy%2Fsecurity%2Flogin%3Fapp%3Dhttps%253A%252F%252Fportal.app.utah.edu%252F');

    // Replace the selectors with the appropriate ones for your login form
    await page.type('#username', 'yourUsername');
    await page.type('#password', 'yourPassword');

    // Replace the selector with the one for your form's submit button
    await page.click('#submit-button');

    // Wait for navigation after the login (optional)
    await page.waitForNavigation();

    console.log('Login successful');

    // Close the browser
    await browser.close();
}

login().catch(console.error);
