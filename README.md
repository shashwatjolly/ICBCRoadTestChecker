# ICBC Road Test Checker

Do you spend a lot of time refreshing the ICBC website looking for a road test slot in vain? Tired of early mornings and late nights? Presenting a tool to automate your woes away! 😁

## How do I run it?

Please have a look at the *Releases* section.

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

When you run the tool for the first time, you'll need to provide your login details - your last name, license number and your keyword. All of this data is stored locally on your PC in `%APPDATA%\ICBCRoadTestChecker` (on Windows). You can also see the tool's logs in the `data` file in this folder.
