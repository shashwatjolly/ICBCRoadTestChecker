const puppeteer = require('puppeteer');
const request = require('request');
const readlineSync = require('readline-sync');
const fs = require('fs');
const winston = require('winston');
const yargs = require('yargs');
const { exit } = require('process');

const signIn = async (browser, page) => {
    logger.info("Opening ICBC's website...");
    console.log("Opening ICBC's website...");
    await page.goto('https://onlinebusiness.icbc.com/webdeas-ui/login;type=driver');
    await page.type('input[formcontrolname="drvrLastName"]', params.userName);
    await page.type('input[formcontrolname="licenceNumber"]', params.licenseNumber);
    await page.type('input[formcontrolname="keyword"]', params.keyword);
    await page.$eval('.mat-checkbox-input', checkbox => checkbox.click());

    await page.$eval('button.mat-raised-button', button => button.click());
    logger.info("Signing in");
    console.log("Signing you in...");

    // Wait for current appointment info to check sign in and get current appointment date
    await page.waitForSelector(".dynamic-appointment-wrapper", {timeout: 5000});
    logger.info("Signed in");
    console.log("Signed in!");
}

const rescheduleAppointment = async (page, location, validAvailableDates) => {
    const appointmentDate = (await page.$eval('div.appointment-time', div => div.innerHTML)).split('<')[0];
    const parts = appointmentDate.trim().split(',');
    currentAppointmentDate = Date.parse(parts[0].slice(0, -2) + "," + parts[1]);
    logger.info("Current appointment date: " + (new Date(currentAppointmentDate)).toDateString());
    await page.$eval('div.appointment-panel button:first-of-type', button => button.click());
    await page.$eval('div.otp-action-buttons > button.mat-raised-button', button => button.click());
    await page.waitForSelector("button.search-button", {timeout: 5000});
    logger.info("Starting location search for " + location);
    console.log("Moving on to location search...");
    await searchAppointmentsByLocation(page, location, validAvailableDates);
}

const searchAppointmentsByLocation = async (page, location, validAvailableDates) => {
    await page.type('input[formcontrolname="finishedAutocomplete"]', location);
    // Wait for autocomplete options
    await page.waitForSelector("mat-option:first-of-type", {timeout: 5000});
    logger.info("Autocomplete options available");
    await page.$eval('mat-option:first-of-type', option => option.click());
    logger.info("Selected first autocomplete option");
    console.log("Selected " + location + " as the location");
    await page.$eval('button.mat-raised-button', button => button.click());
    // Wait for centres to be populated
    await page.waitForSelector("div.department-container", {timeout: 5000});
    logger.info("Centres available");
    const containers = await page.$$('div.department-container');
    for(let i = 0; i < containers.length; i++) {
        await checkAvailabliityInContainer(page, containers[i], validAvailableDates);
    }
}

const checkAvailabliityInContainer = async (page, container, validAvailableDates) => {
    await container.click();
    // Wait for either a "no appointment" message or a visible available date
    const elementHandle = await page.waitForSelector('.no-appts-msg, .date-title', {timeout: 5000});
    logger.info("Centre date times panel open");
    const className = await page.evaluate(element => element.className, elementHandle);
    const title = await page.$eval('.location-title', text => text.innerHTML);
    console.log(title + ":");
    if(className != "no-appts-msg") {
        logger.info("Appointments available for " + title);
        const dates = await page.$$eval('.date-title', div => div.map(button => button.innerHTML));
        const parsedDates = dates.map(date => {
                                const parts = date.trim().split(',');
                                const formattedDate = parts[0] + "," + parts[1].slice(0, -2) + "," + parts[2];
                                return Date.parse(formattedDate);
                            });
        // currentAppointmentDate = Date.parse("February 9, 2022");
        validAvailableDates[title] = parsedDates.filter(parsedDate => {
            const daysDifferenceAppointment = Math.ceil((currentAppointmentDate - parsedDate)/(1000 * 60 * 60 * 24));
            const daysDifferenceCurrent = Math.floor((parsedDate - Date.now())/(1000 * 60 * 60 * 24));
            return daysDifferenceAppointment > 0 && daysDifferenceCurrent >= params.dayLimit;
        });
        validAvailableDates[title] = validAvailableDates[title].map(date => (new Date(date)).toDateString());
        console.log(validAvailableDates[title]);
    }
    else {
        logger.info("No appointments available for " + title);
        console.log("No slots available");
    }
    // Back button
    await page.$eval('div.actions-container > button.mat-stroked-button', button => button.click());
}


const sendNotificationEmail = (validAvailableDates) => {
    if(params.userEmail == "") {
        logger.info("User email empty");
        return;
    }
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
        logger.info("Email body empty");
        return;
    }

    const options = {
        url: 'https://icbcroadtestchecker.azurewebsites.net/api/sendNotificationEmail?code=kw84GIMWVRrQOxfVUYksizytI1igUe7uUhVgrxjIEk80i1eclHn47w==',
        json: true,
        body: {
            userEmail: params.userEmail,
            emailBody
        }
    };
    
    request.post(options, (err, res, body) => {
        if (err) {
            logger.error("Failed to send email: " + err);
            return console.log("Failed to send email: " + err);
        }
        logger.info(`Email sent, status: ${res.statusCode}`);
        console.log(`Email sent, status: ${res.statusCode}`);
    });
}

const readCreds = () => {
    logger.info("Reading params");
    const paramsFile = appDataDir + "/params.json";
    if (fs.existsSync(paramsFile)) {
        logger.info("params.json found");
        const rawData = fs.readFileSync(paramsFile);
        params = JSON.parse(rawData);
    } else {
        logger.info("params.json not found. Reading input from stdin and creating params.json.");
        params.userName = readlineSync.question("Please enter driver's last name: ");
        params.licenseNumber = readlineSync.question("Please enter BC driver's licence number: ");
        params.keyword = readlineSync.question("Please enter keyword: ", {
            hideEchoBack: true
        });
        params.dayLimit = readlineSync.question("Please enter the number of days from today after which you want to search for road test dates: ");   
        params.userEmail = readlineSync.question("Please enter email for availability notifications (optional): ");
        logger.info("Read input from stdin. Creating params.json.");
        fs.writeFileSync(paramsFile, JSON.stringify(params));
    }
}

const initLogger = () => {
    if (!fs.existsSync(appDataDir)) {
        fs.mkdirSync(appDataDir);
    }
    const myFormat = winston.format.printf(({ level, message, timestamp }) => {
        return `${timestamp}, ${level}, ${message}`;
      });
    logger = winston.createLogger({
        transports: [
            new winston.transports.File({ filename:  appDataDir + '/data.log', options: { flags: 'w' } }),
        ],
        format: winston.format.combine(
            winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
            myFormat
          ),
    });
}

let currentAppointmentDate = "";
const appDataDir = process.env.APPDATA + "/ICBCRoadTestChecker";
let params = {};
let logger;
let browser = null;

const main = async () => {
    initLogger();
    try {
        if (process.env.NODE_ENV === "production") {
            const packagedChromePath = "./chrome-win/chrome.exe"
            const args = yargs.argv;
            const userChromePath = args.chromePath;
            if(userChromePath) {
                browser = await puppeteer.launch({executablePath: userChromePath, slowMo: 150});
            }
            else {
                if(fs.existsSync(packagedChromePath)) {
                    browser = await puppeteer.launch({executablePath: packagedChromePath, slowMo: 150});
                }
                else {
                    console.log("Please specify your chrome installation path using --chromePath.");
                    console.log("Press Ctrl+C to exit (or just close the app)");
                    return;
                }
            }
        }
        else {
            browser = await puppeteer.launch({slowMo: 150});
        }
        readCreds();
        const page = await browser.newPage();
        let validAvailableDates = {};
        let validLocations = ["Vancouver, BC", "Richmond, BC", "Surrey, BC"];
        for(let i = 0; i<validLocations.length; i++) {
            validAvailableDates[validLocations[i]] = {};
            await signIn(browser, page);
            await rescheduleAppointment(page, validLocations[i], validAvailableDates[validLocations[i]]);
        }
        sendNotificationEmail(validAvailableDates);
    }
    catch(err) {
        console.log(err);
        logger.error(err);
    }
    finally {
        if(browser) {
            await browser.close();
        }
    }
};

// 20 min = 15*60*1000 = 900000
const runner = async () => {
    await main();
    setTimeout(runner, 900000);
};

runner();
