const puppeteer = require('puppeteer');
const express = require("express");


const app = express();
const CLOCK_IN = true;
const CLOCK_OUT = false;
app.get('/', (req, res) => {
    res.send(Date.now().toString());
})

app.get('/clock-in', async (req, res) => {
    console.log("Action : Clock-in")
    const status = await kekaAttendance(CLOCK_IN);
    res.send(status);
});

app.get('/clock-out', async (req, res) => {
    console.log("Action : Clock-out")
    const status = await kekaAttendance(CLOCK_OUT);
    res.send(status);
});


const port = process.env.PORT || 3000;
app.listen(port, () =>
    console.info(`Listening on port ${port}.`)
);

async function kekaAttendance(status) {
    let result = false;
    try {
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const context = browser.defaultBrowserContext();
        await context.overridePermissions('https://walkover.keka.com/', ['geolocation']);
        const page = await browser.newPage();

        await page.goto('https://walkover.keka.com/');
        const loginWithKekaSelector = `#login-container-center > div > div > div.form-group > form > button.btn.btn-danger.btn-login.btn-keka-login`
        try {
            await page.waitForSelector(loginWithKekaSelector);
            console.log("Login with email and password");
            await dummyWait(5000);
            await page.click(loginWithKekaSelector);
            await dummyWait(5000);
        } catch (reason) {
            console.log(reason);
        }
        const credential = {
            email: process.env.email,
            password: process.env.password
        }
        const emailSelector = '#email';
        const passwordSelector = `#password`;
        const loginButtonSelector = '#login-container-center > div > div > form > div > div.form-group > div > button';
        await page.waitForSelector(emailSelector);
        await page.type(emailSelector, credential.email);
        await page.type(passwordSelector, credential.password);
        await dummyWait(5000);
        console.log("Clicking on sign in button");
        await page.click(loginButtonSelector);

        const clockInButtonSelector = 'body > xhr-app-root > div > xhr-home > div > home-dashboard > div > div > div > div > div:nth-child(2) > div > div:nth-child(1) > div:nth-child(6) > home-attendance-clockin-widget > div > div.card-body.clear-padding.d-flex.flex-column.justify-content-between > div > div.h-100.d-flex.align-items-center > div > div.d-flex.align-items-center > div:nth-child(1) > button';
        const clockOutButtonSelector = 'body > xhr-app-root > div > xhr-home > div > home-dashboard > div > div > div > div > div:nth-child(2) > div > div:nth-child(1) > div:nth-child(6) > home-attendance-clockin-widget > div > div.card-body.clear-padding.d-flex.flex-column.justify-content-between > div > div.h-100.d-flex.align-items-center > div > div.d-flex.align-items-center > div > div > button';
        const clockOutConfirmationSelector = 'body > xhr-app-root > div > xhr-home > div > home-dashboard > div > div > div > div > div:nth-child(2) > div > div:nth-child(1) > div:nth-child(6) > home-attendance-clockin-widget > div > div.card-body.clear-padding.d-flex.flex-column.justify-content-between > div > div.h-100.d-flex.align-items-center > div > div.d-flex.align-items-center > div > div:nth-child(1) > button.btn.btn-danger.btn-x-sm.mr-10';
        await dummyWait(20000);
        console.log("Setting Location");
        await page.setGeolocation({ latitude: 75.518204, longitude: 32.390320 });
        if ((await page.$(clockOutButtonSelector)) !== null) {
            console.log("You are already clocked-in.");
            if (!status) {
                console.log("Clocking you out!")
                await page.click(clockOutButtonSelector).catch((reason) => {
                    console.log(reason);
                });
                await page.waitForSelector(clockOutConfirmationSelector);
                await page.click(clockOutConfirmationSelector).catch((reason) => {
                    console.log(reason);
                });
                result = true;
            } else {
                // No need to clock out because user is not clocked in.
                result = true;
            }
        } else {
            console.log("You are not clocked-in.");
            if ((await page.$(clockInButtonSelector).catch(() => null)) !== null) {
                if (status) {
                    console.log("Clocking you in!");
                    await page.click(clockInButtonSelector).catch((reason) => {
                        console.log(reason);
                    });
                    result = true;
                } else {
                    // No need to clock in.
                    result = true;
                }
            }
        }
        await dummyWait(5000);
        console.log("Closing the browser.");
        await browser.close();
    } catch (error) {
        console.log(error);
        result = false;
    }
    return result;

}

async function dummyWait(time = 1000) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(true);
        }, time)
    });
}