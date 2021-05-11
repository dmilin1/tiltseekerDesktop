# Tiltseeker Desktop

## Download Link

Go [here](https://github.com/dmilin1/tiltseekerDesktop/releases) and download the latest .exe file. Tiltseeker will install and an icon will appear in your Windows tray. Start a game to use it!

## What is it?

Tiltseeker Desktop is a complementary tool to the [Tiltseeker website](https://tiltseeker.com). It serves two primary purposes. First, to provide best picks and bans based on current info known in champ select.
![Screenshot](https://raw.githubusercontent.com/dmilin1/tiltseekerDesktop/master/info/screenshot1.png)

Second, Tiltseeker Desktop injects the Tiltseeker website on top of the in game client so users can pull up the website info by pressing the "-" key in game.

## How to build for myself?

You'll need Node.js and windows build tools preinstalled.

Copy this repo, then run the following commands:

    npm link ./electron-overlay
    npm link ./node-ovhook
    npm install

You should now be able to run the project by running:

    npm start

To build a release version of the app, run:

    npm run make

Or, to build a packaged version, run:

    npm run package
