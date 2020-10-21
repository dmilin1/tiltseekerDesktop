const { app, BrowserWindow } = require('electron')
const path = require('path')
const ioHook = require('iohook');
const Settings = require('./../../Settings/settings.js')
const { ServerDataTransfer } = require('./../../DataTransfer/dataTransfer.js')


module.exports = function() {

	var settings = new Settings()
	var mainWindow = new BrowserWindow({
		width: 650,
		height: 420,
		// backgroundColor: '#686868',
		fullscreenable: false,
		maximizable: false,
		frame: false,
		transparent: true,
		show: false,
		webPreferences: {
			nodeIntegration: true,
		},
		icon: '/../../Resources/Images/favicon.ico',
	})
	mainWindow.loadFile(path.join(__dirname, '/main.html'))


	var returnOneKey = null

	var dataTransfer = new ServerDataTransfer(mainWindow, 'mainWindow', {
		exitPressed: (data) => {
			mainWindow.hide()
		},
		toggleRunAtStart: () => {
			settings.set('runAtStart', !settings.get('runAtStart'))
			dataTransfer.send('settingsUpdate', settings.getCurrentSettings())
		},
		toggleHotkeyIsToggle: () => {
			settings.set('hotkeyIsToggle', !settings.get('hotkeyIsToggle'))
			dataTransfer.send('settingsUpdate', settings.getCurrentSettings())
		},
		setBestChampsLimit: (num) => {
			settings.set('bestChampsLimit', Number(num) || 0)
			dataTransfer.send('settingsUpdate', settings.getCurrentSettings())
		},
		getHotkey: () => {
			returnOneKey = (e) => {
				settings.set('hotkey', e)
				returnOneKey = null
				dataTransfer.send('settingsUpdate', settings.getCurrentSettings())
			}
		},
		requestSettings: () => {
			dataTransfer.send('settingsUpdate', settings.getCurrentSettings())
		},
	})

	ioHook.on('keydown', e => {
		if (
			returnOneKey &&
			e.rawcode != 160 && // shift
			e.rawcode != 162 && // ctrl
			e.rawcode != 164 && // option
			e.rawcode != 91     // meta
		) { returnOneKey(e) }
	})
	ioHook.start()


	mainWindow.on('minimize', (event) => {
		event.preventDefault()
		mainWindow.hide()
	});

	mainWindow.on('close', (event) => {
		if(!app.isQuiting){
			event.preventDefault();
			mainWindow.hide();
		}

		return false;
	});


	return mainWindow
}
