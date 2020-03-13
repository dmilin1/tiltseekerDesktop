const {
  ipcMain
} = require('electron');

const {
  ipcRenderer
} = require('electron');

class ServerDataTransfer {
  constructor(window, name, listenerFunctions) {
    this.send = (func, data) => {
      this.state.window.webContents.send(this.state.name + '-window', [func, data]);
    };

    this.state = {
      window: window,
      name: name
    };
    ipcMain.on(name + '-server', (event, functionData) => {
      if (listenerFunctions[functionData[0]]) {
        listenerFunctions[functionData[0]](functionData[1]);
      } else {
        console.log('FUNCTION DOES NOT EXIST');
      }
    });
  }

}

class WindowDataTransfer {
  constructor(name, listenerFunctions) {
    this.send = (func, data) => {
      ipcRenderer.send(this.state.name + '-server', [func, data]);
    };

    this.state = {
      name: name
    };
    ipcRenderer.on(name + '-window', (event, functionData) => {
      if (listenerFunctions[functionData[0]]) {
        listenerFunctions[functionData[0]](functionData[1]);
      } else {
        console.log('FUNCTION DOES NOT EXIST');
      }
    });
  }

}

module.exports = {
  ServerDataTransfer,
  WindowDataTransfer
};