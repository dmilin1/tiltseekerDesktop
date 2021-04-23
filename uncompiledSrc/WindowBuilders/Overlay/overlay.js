const { ipcRenderer, webFrame } = window.require('electron')
const { WindowDataTransfer } = require('./../../DataTransfer/dataTransfer.js')

window.desktop = true
window.ipcRenderer = ipcRenderer
window.webFrame = webFrame
window.dataTransfer = WindowDataTransfer