const {
  app,
  dialog,
  Menu,
  Tray
} = require('electron');

const makeMainWindow = require('./WindowBuilders/Main/makeMainWindow.js');

const makeOverlayWindow = require('./WindowBuilders/Overlay/makeOverlayWindow.js');

const makeChampSelectWindow = require('./WindowBuilders/ChampSelect/makeChampSelectWindow.js');

const {
  ClientApi
} = require('./Utilities/ClientApi.js');

const path = require('path'); // Handle creating/removing shortcuts on Windows when installing/uninstalling.


if (require('electron-squirrel-startup')) {
  app.quit();
}

require('update-electron-app')({
  repo: 'dmilin1/tiltseekerDesktop',
  updateInterval: '10 minutes'
});

var mainWindow = null;
var appIcon = null;
const singleInstanceLock = app.requestSingleInstanceLock();

if (!singleInstanceLock) {
  app.on('ready', () => {
    dialog.showMessageBox({
      title: 'Tiltseeker Desktop',
      message: 'Tiltseeker is already running! Jump into a league game to get started, or you can access the settings pannel in the toolbar.',
      icon: '/Resources/Images/favicon.png'
    });
  });
}

app.on('ready', () => {
  require('./SetupScripts/getRiotFolder.js')();

  clientApi = new ClientApi();
  mainWindow = makeMainWindow(clientApi);
  overlayWindow = makeOverlayWindow(clientApi);
  champSelectWindow = makeChampSelectWindow(clientApi);
  var contextMenu = Menu.buildFromTemplate([{
    label: 'Settings',
    click: () => {
      mainWindow.show();
    }
  }, {
    label: 'Quit',
    click: () => {
      app.isQuiting = true;
      app.quit();
    }
  }]);
  appIcon = new Tray(path.join(__dirname, '/Resources/Images/favicon.png'));
  appIcon.setContextMenu(contextMenu);
});
app.on('before-quit', function () {
  app.isQuiting = true;
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = makeMainWindow();
  }
});
app.on('second-instance', () => {
  app.quit();
}); // In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.