const { app, BrowserWindow, screen } = require('electron')
const path = require('path')
const Settings = require('./../../Settings/settings.js')

const ioHook = require('iohook')

const { regions, regionConvert } = require('./../../constants.js')

module.exports = async function(clientApi) {

	const { width, height } = screen.getPrimaryDisplay().workAreaSize

	var settings = new Settings()
	var overlayWindow = new BrowserWindow({
		width: width,
		height: height,
		// backgroundColor: '#686868',
		fullscreenable: false,
		maximizable: false,
		frame: false,
		transparent: true,
		show: false,
		focusable: false,
		skipTaskbar: true,
		autoHideMenuBar: true,
		webPreferences: {
			nodeIntegration: true,
		},
		icon: '/../../Resources/Images/favicon.ico',
	})

	overlayWindow.setAlwaysOnTop(true, "floating");
	overlayWindow.setVisibleOnAllWorkspaces(true);

	var isHotkey = (event) => {
		return (
			event.rawcode == settings.get('hotkey').rawcode &&
			event.shiftKey == settings.get('hotkey').shiftKey &&
			event.altKey == settings.get('hotkey').altKey &&
			event.ctrlKey == settings.get('hotkey').ctrlKey &&
			event.metaKey == settings.get('hotkey').metaKey
		)
	}

	ioHook.on('keydown', event => {
		if (isHotkey(event)) {
			if (settings.get('hotkeyIsToggle') && overlayWindow.isVisible()) {
				overlayWindow.hide()
			} else {
				overlayWindow.show()
			}
			console.log('hotkey pressed')
		}
	})

	ioHook.on('keyup', event => {
		if (event.rawcode == settings.get('hotkey').rawcode) {
			if (!settings.get('hotkeyIsToggle')) {
				overlayWindow.hide()
			}
		}
	})

	ioHook.start()


	loadGame = async () => {
		username = (await clientApi.get('/lol-summoner/v1/current-summoner')).displayName
		region = regionConvert[(await clientApi.get('/riotclient/get_region_locale')).region]
		overlayWindow.loadURL(`https://tiltseeker.com/tiltseek?region=${region}&summonerName=${encodeURIComponent(username)}&desktop=true`)
		console.log('loading game')
		console.log(`https://tiltseeker.com/tiltseek?region=${region}&summonerName=${encodeURIComponent(username)}&desktop=true`)
	}

	clientApi.subscribe('/lol-gameflow/v1/gameflow-phase', async (phase) => {
		console.log(phase)
		if (phase == 'InProgress') {
			loadGame()
		}
	})


	overlayWindow.on('minimize', (event) => {
		event.preventDefault()
		overlayWindow.hide()
	});

	overlayWindow.on('close', (event) => {
		if(!app.isQuiting){
			event.preventDefault();
			overlayWindow.hide();
		}

		return false;
	});

	return overlayWindow
}
