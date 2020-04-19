const { app, BrowserWindow } = require('electron')
const path = require('path')
const Settings = require('./../../Settings/settings.js')
const { ServerDataTransfer } = require('./../../DataTransfer/dataTransfer.js')
const { WindowManager } = require('./../../Utilities/WindowManager.js')
const { WinRateCalc } = require('./../../Utilities/WinRateCalc.js')
const axios = require('axios')


module.exports = function() {

	this.state = {
		picksAndBans: {
			allyTeam: {
				picks: {},
				bans: {},
			},
			opponentTeam: {
				picks: {},
				bans: {},
			}
		},
		localPlayerCellId: null,
		championMasteries: null,
		stats: null,
		inChampSelect: false,
	}

	var settings = new Settings()
	var windowManager = new WindowManager()
	var winRateCalc = new WinRateCalc()

	var champSelectWindow = new BrowserWindow({
		width: 1600,
		height: 72,
		backgroundColor: '#686868',
		alwaysOnTop: true,
		fullscreenable: false,
		maximizable: false,
		resizable: false,
		frame: false,
		show: false,
		focusable: false,
		skipTaskbar: true,
		autoHideMenuBar: true,
		webPreferences: {
			nodeIntegration: true,
		},
		icon: '/../../Resources/Images/favicon.ico',
	})
	champSelectWindow.loadFile(path.join(__dirname, '/champSelect.html'))


	var dataTransfer = new ServerDataTransfer(champSelectWindow, 'champSelectWindow', {
		setSetting: (arr) => {
			var settingName = arr[0]
			var settingData = arr[1]
			settings.set(settingName, settingData)
			this.updateCalculations()
		},
		requestSettings: () => {
			dataTransfer.send('settingsUpdate', {
				compensateForWinrate: settings.get('compensateForWinrate'),
				bestChampsOnly: settings.get('bestChampsOnly'),
			})
		}
	})

	var updateCalculations = () => {
		var potentialPicks = this.state.championMasteries.map(champ => champ.championId)
		dataTransfer.send('winRateData', winRateCalc.getWinRate(
			this.state.picksAndBans,
			this.state.stats,
			this.state.localPlayerCellId,
			potentialPicks,
		))
	}

	var resetPicksAndBans = () => {
		this.state.picksAndBans = {
			allyTeam: {
				picks: {},
				bans: {},
			},
			opponentTeam: {
				picks: {},
				bans: {},
			}
		}
	}

	windowManager.setCallback((bounds) => {
		if (bounds === null) {
			champSelectWindow.hide()
		} else {
			var height = bounds.widthHeight[1]*0.08
			champSelectWindow.setBounds({
				x: bounds.topLeft[0],
				y: bounds.topLeft[1] - height,
				width: bounds.widthHeight[0],
				height: height,
			})
			champSelectWindow.show()
		}
	})


	clientApi.subscribe('/lol-gameflow/v1/gameflow-phase', async (phase) => {
		resetPicksAndBans()
		if (phase == 'ChampSelect') {
			this.state.stats = (await axios.get('https://tiltseeker.com/api/na/stats')).data

			var summonerId = (await clientApi.get('/lol-login/v1/session')).summonerId
			this.state.championMasteries = await clientApi.get(`/lol-collections/v1/inventories/${summonerId}/champion-mastery`)

			this.state.inChampSelect = true
			windowManager.start()
		} else {
			this.state.inChampSelect = false
			champSelectWindow.hide()
			windowManager.stop()
		}
	})

	clientApi.subscribe('/lol-champ-select/v1/session', async (session) => {
		if (this.state.inChampSelect) {

			this.state.localPlayerCellId = session.localPlayerCellId

			for (var subset of session.actions) {
				for (var action of subset) {
					var type = action.type == 'pick' ? 'picks' : 'bans'
					var team = action.isAllyAction ? 'allyTeam' : 'opponentTeam'
					if (action.championId !== 0) {
						this.state.picksAndBans[team][type][action.actorCellId] = {
							championId: action.championId,
							completed: action.completed,
						}
					}
				}
			}
			updateCalculations()
		}
	})


	return champSelectWindow
}
