var _temp;

const {
  app
} = require('electron');

const Store = require('electron-store');

const path = require('path');

const fs = require('fs');

module.exports = (_temp = class Settings {
  constructor() {
    this.defaults = {
      runAtStart: true
    };

    this.setUnsetSettings = () => {
      for (var [key, value] of Object.entries(this.defaults)) {
        if (this.get(key) === undefined) {
          this.set(key, value);
        }
      }
    };

    this.get = key => {
      return this.store.get(key);
    };

    this.set = (key, val) => {
      if (key === 'runAtStart') {
        this.runAtStart(val);
      }

      return this.store.set(key, val);
    };

    this.runAtStart = val => {
      const appFolder = path.dirname(process.execPath);
      const updateExe = path.resolve(appFolder, '..', 'Update.exe');
      const exeName = path.basename(process.execPath);
      app.setLoginItemSettings({
        openAtLogin: val,
        path: updateExe,
        args: ['--processStart', `"${exeName}"`, '--process-start-args', `"--hidden"`]
      });
      console.log('Run at startup set to: ' + val);
    };

    this.store = new Store();
    this.setUnsetSettings();
  } // sets any default settings values that are undefined


}, _temp);