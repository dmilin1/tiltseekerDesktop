const {
  app,
  BrowserWindow
} = require('electron');

const path = require('path');

const Settings = require('./../../Settings/settings.js');

const {
  ServerDataTransfer
} = require('./../../DataTransfer/dataTransfer.js');

module.exports = function () {
  settings = new Settings();
  mainWindow = new BrowserWindow({
    width: 550,
    height: 300,
    // backgroundColor: '#686868',
    fullscreenable: false,
    maximizable: false,
    frame: false,
    transparent: true,
    show: false,
    webPreferences: {
      nodeIntegration: true
    },
    icon: '/../../Resources/Images/favicon.ico'
  });
  mainWindow.loadFile(path.join(__dirname, '/main.html'));
  currentSettings = {
    runAtStart: settings.get('runAtStart')
  };
  dataTransfer = new ServerDataTransfer(mainWindow, 'mainWindow', {
    exitPressed: data => {
      mainWindow.hide();
    },
    toggleRunAtStart: () => {
      settings.set('runAtStart', !settings.get('runAtStart'));
      currentSettings.runAtStart = settings.get('runAtStart');
      dataTransfer.send('settingsUpdate', currentSettings);
    },
    requestSettings: () => {
      dataTransfer.send('settingsUpdate', currentSettings);
    }
  });
  mainWindow.on('minimize', event => {
    event.preventDefault();
    mainWindow.hide();
  });
  mainWindow.on('close', event => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }

    return false;
  });
  return mainWindow;
};