const { app, BrowserWindow, screen } = require('electron')
const path = require('path')
const Settings = require('./../../Settings/settings.js')

const ioHook = require('iohook')

const { regions, regionConvert } = require('./../../constants.js')

module.exports = async function(clientApi) {

	var isShowing = false
	const { width, height } = screen.getPrimaryDisplay().workAreaSize

	settings = new Settings()
	overlayWindow = await new BrowserWindow({
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

	ioHook.on('keydown', event => {
		 if (event.keycode == 43) {
			 overlayWindow.show()
		 }
	})

	ioHook.on('keyup', event => {
		 if (event.keycode == 43) {
			 overlayWindow.hide()
		 }
	})

	ioHook.start()


	loadGame = async () => {
		username = (await clientApi.get('/lol-summoner/v1/current-summoner')).displayName
		region = regionConvert[(await clientApi.get('/riotclient/get_region_locale')).region]
		overlayWindow.loadURL(`http://localhost:3000/tiltseek?region=${region}&summonerName=${encodeURIComponent(username)}&desktop=true`)
		console.log('loading game')
	}

	clientApi.subscribe('/lol-gameflow/v1/gameflow-phase', async (phase) => {
		console.log(phase.data)
		if (phase.data == 'InProgress') {
			loadGame()
		}
	})

	// console.log(await clientApi.get('/lol-gameflow/v1/gameflow-phase'))

	if (await clientApi.get('/lol-gameflow/v1/gameflow-phase') == 'InProgress') {
		loadGame()
	}




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

	overlayWindow.on('show', (event) => {
		isShowing = true
	});

	overlayWindow.on('hide', (event) => {
		isShowing = false
	});


	return overlayWindow
}
