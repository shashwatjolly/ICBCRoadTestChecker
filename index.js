const puppeteer = require('puppeteer');

const signIn = async (browser, page) => {
    await page.goto('https://onlinebusiness.icbc.com/webdeas-ui/login;type=driver');
    await page.type('input[formcontrolname="drvrLastName"]', "Patel");
    await page.type('input[formcontrolname="licenceNumber"]', "4569157");
    await page.type('input[formcontrolname="keyword"]', "Patil");
    await page.$eval('.mat-checkbox-input', checkbox => checkbox.click());

    await page.$eval('button.mat-raised-button', button => button.click());
    console.log("Signing you in...");

    await page.waitForSelector(".dynamic-appointment-wrapper", {timeout: 5000});
    console.log("Signed in!");
    // const body = await page.evaluate(() => {
    //     return document.querySelector('body').innerHTML;
    // });
    // console.log(body);
    // await browser.close();
}

const rescheduleAppointment = async (page) => {
    await page.$eval('div.appointment-panel button:first-of-type', button => button.click());
    await page.$eval('div.otp-action-buttons > button.mat-raised-button', button => button.click());
    await page.waitForSelector("button.search-button", {timeout: 5000});
    console.log("Moving on to location search...");
    await searchAppointmentsByLocation(page, "Vancouver, BC");
}

const checkAvailabliityInContainer = async (page, container) => {
    await container.click();
    const elementHandle = await page.waitForSelector('.no-appts-msg, .date-title', {timeout: 5000});
    const className = await page.evaluate(element => element.className, elementHandle);
    console.log("WOOHOO " + className)
    const temp = await page.evaluate(element => element.innerHTML, elementHandle);
    console.log("WOOHOOOOOO " + temp)
    if(className != "no-appts-msg") {
        const t = await page.$$eval('button.mat-button-toggle-button', buttons => buttons.map(button => button.innerHTML));
        console.log(t);
    }
    await page.$eval('div.actions-container > button.mat-stroked-button', button => button.click());
}

const searchAppointmentsByLocation = async (page, location) => {
    await page.type('input[formcontrolname="finishedAutocomplete"]', location);
    await page.waitForSelector("mat-option", {timeout: 5000});
    await page.$eval('mat-option:first-of-type', option => option.click());
    console.log("Selected " + location + " as the location");
    await page.$eval('button.mat-raised-button', button => button.click());
    await page.waitForSelector("div.department-container", {timeout: 5000});
    const containers = await page.$$('div.department-container');
    // console.log(containers.length);
    for(let i = 0; i < containers.length; i+=1) {
        await checkAvailabliityInContainer(page, containers[i]);
    }
    // containers.forEach(async (container) => {
        // const t = await page.evaluate(container => container.innerHTML, container);
        // console.log(t);
        // await checkAvailabliityInContainer(page, container);
    // }); 
    // const containers = await page.$$('div.department-container');
    // await checkAvailabliityInContainer(page, containers[1]);
}

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await signIn(browser, page);
    await rescheduleAppointment(page);
})();
