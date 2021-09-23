# ICBC Road Test Checker

Do you spend a lot of time refreshing the ICBC website looking for a road test slot in vain? Tired of early mornings and late nights? Presenting a tool to automate your woes away! 😁

## How do I run it?

Please have a look at the [*Releases* section](https://github.com/shashwatjolly/ICBCRoadTestChecker/releases/).

Zip files include a version of Chromium needed for the script to work. It should be the default option for most users. Extract the zip file and run the binary included in it.

To use the standalone binary files, you need to have Chromium (or any Chromium-based browser) already installed. Please specify the browser executable path using --chromePath.

Download the release corresponding to your platform (ending with -).

Or you can [build from source](#building-from-source).

## How do I change the locations the script searches for?

The locations are currently specific to Vancouver, and have been declared in the [index.js](https://github.com/shashwatjolly/ICBCRoadTestChecker/blob/main/index.js) file. You can make changes to the `validLocations` array [here](https://github.com/shashwatjolly/ICBCRoadTestChecker/blob/8bc57dbaad870136a0ed5c03a7b5d259cf9ea38c/index.js#L221) to change the locations to search for. You'll have to [build from source](#building-from-source) in that case.

## Building from source

For most users based in Vancouver, the preferred way to run [should be from the `Releases` section](#how-do-i-run-it).

To run the tool from source, you'll need to install [Node and NPM](https://nodejs.org/en/download/). Then run:
- `git clone https://github.com/shashwatjolly/ICBCRoadTestChecker.git`
- `cd ICBCRoadTestChecker`
- `npm install`
- `node index.js`

## Running the tool

Before running the tool, you need to book an appointment on the ICBC website - it doesn't need to be a specific date, any appointment will do. The tool will only search for appointments *before* this date.

When you run the tool for the first time, you'll need to provide your login details - your last name, license number and your keyword. All of this data is stored locally on your PC in `%APPDATA%\ICBCRoadTestChecker` (on Windows). You can also see the tool's logs in the `data` file in this folder.

You'll also need to specify the `number of days from today after which you want to search for road test dates`. This means the tool won't search for an appointment on just the next day or the day after that. It will look for dates beyond the limit specified - once you are ready :)

**If the tool has difficulty signing in, it might be that there's some type/issue in the credentials entered. You can verify the credentials by going to `%APPDATA%\ICBCRoadTestChecker\params.json`. You can make any corrections there, save the file and run the tool again.**

## Receiving email notifications

The tool asks for your email address as part of the one-time setup. This is optional - you only need it if you want to be notified of new appointment dates through email. You can leave the field blank to opt out of the emails and just have a look at the logs if you want.

**If you have specified your email, but can't see notifications in your inbox, be sure to check your spam folder and mark it as "not spam" to receive future notifications**


