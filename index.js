const puppeteer = require('puppeteer');
const request = require('request');

const signIn = async (browser, page) => {
    console.log("Opening ICBC's website...")
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

const rescheduleAppointment = async (page, location, validAvailableDates) => {
    const appointmentDate = (await page.$eval('div.appointment-time', div => div.innerHTML)).split('<')[0];
    const parts = appointmentDate.trim().split(',');
    currentAppointmentDate = Date.parse(parts[0].slice(0, -2) + "," + parts[1]);
    await page.$eval('div.appointment-panel button:first-of-type', button => button.click());
    await page.$eval('div.otp-action-buttons > button.mat-raised-button', button => button.click());
    await page.waitForSelector("button.search-button", {timeout: 5000});
    console.log("Moving on to location search...");
    await searchAppointmentsByLocation(page, location, validAvailableDates);
}

const checkAvailabliityInContainer = async (page, container, validAvailableDates) => {
    await container.click();
    const elementHandle = await page.waitForSelector('.no-appts-msg, .date-title', {timeout: 5000});
    const className = await page.evaluate(element => element.className, elementHandle);
    const title = await page.$eval('.location-title', text => text.innerHTML);
    console.log(title + ":");
    if(className != "no-appts-msg") {
        const dates = await page.$$eval('.date-title', div => div.map(button => button.innerHTML));
        const parsedDates = dates.map(date => {
                                const parts = date.trim().split(',');
                                const formattedDate = parts[0] + "," + parts[1].slice(0, -2) + "," + parts[2];
                                return Date.parse(formattedDate);
                            });
        currentAppointmentDate = Date.parse("February 9, 2022");
        validAvailableDates[title] = parsedDates.filter(parsedDate => {
            const daysDifferenceAppointment = Math.ceil((currentAppointmentDate - parsedDate)/(1000 * 60 * 60 * 24));
            const daysDifferenceCurrent = Math.floor((parsedDate - Date.now())/(1000 * 60 * 60 * 24));
            return daysDifferenceAppointment > 0 && daysDifferenceCurrent >= 30;
        });
        validAvailableDates[title] = validAvailableDates[title].map(date => (new Date(date)).toDateString());
    }
    else {
        console.log("No slots available");
    }
    await page.$eval('div.actions-container > button.mat-stroked-button', button => button.click());
}

const searchAppointmentsByLocation = async (page, location, validAvailableDates) => {
    await page.type('input[formcontrolname="finishedAutocomplete"]', location);
    await page.waitForSelector("mat-option:first-of-type", {timeout: 5000});
    await page.$eval('mat-option:first-of-type', option => option.click());
    console.log("Selected " + location + " as the location");
    await page.$eval('button.mat-raised-button', button => button.click());
    await page.waitForSelector("div.department-container", {timeout: 5000});
    const containers = await page.$$('div.department-container');
    for(let i = 0; i < containers.length; i++) {
        await checkAvailabliityInContainer(page, containers[i], validAvailableDates);
    }
}

const sendNotificationEmail = (validAvailableDates) => {
    let emailBody = "";
    for(location in validAvailableDates) {
        let emailBodyForLocation = ""
        for(centre in validAvailableDates[location]) {
            if(validAvailableDates[location][centre].length == 0) {
                continue;
            }
            emailBodyForLocation += "<h3>" + centre + "</h3> </br> <ul>";
            for(date of validAvailableDates[location][centre]) {
                emailBodyForLocation += "<li>" + date + "</li>";
            }
            emailBodyForLocation += "</ul><br>";
        }
        if(emailBodyForLocation.length > 0) {
            emailBody += "<h2>" + location + ":</h2> </br>" + emailBodyForLocation;
        }
    }

    if(emailBody.length == 0) {
        return;
    }

    const options = {
        url: 'https://icbcroadtestchecker.azurewebsites.net/api/sendNotificationEmail?code=kw84GIMWVRrQOxfVUYksizytI1igUe7uUhVgrxjIEk80i1eclHn47w==',
        json: true,
        body: {
            userEmail: "jahnvi.1210@gmail.com",
            emailBody
        }
    };
    
    request.post(options, (err, res, body) => {
        if (err) {
            return console.log(err);
        }
        console.log(`Status: ${res.statusCode}`);
        console.log(body);
    });
}

let currentAppointmentDate = "";

(async () => {
    const browser = await puppeteer.launch({slowMo: 150});
    const page = await browser.newPage();
    let validAvailableDates = {};
    let validLocations = ["Vancouver, BC", "Richmond, BC"];
    for(let i = 0; i<validLocations.length; i++) {
        validAvailableDates[validLocations[i]] = {};
        await signIn(browser, page);
        await rescheduleAppointment(page, validLocations[i], validAvailableDates[validLocations[i]]);
    }
    console.log(validAvailableDates);
    sendNotificationEmail(validAvailableDates);
    await browser.close();
})();

