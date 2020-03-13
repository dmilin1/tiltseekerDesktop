const { app, dialog } = require('electron')
const path = require('path')
const Settings = require('./../Settings/settings.js')
const fs = require('fs')

module.exports = function() {
	settings = new Settings()

	folderValid = (dir) => {
		return fs.existsSync(dir + '/League of Legends/LeagueClient.exe')
	}

	runSetup = () => {

		var dir = dialog.showOpenDialogSync({
			title: "Please locate the 'Riot Games' install folder",
			message: "Please locate the 'Riot Games' install folder",
			properties: ['openDirectory']
		})

		if (dir === undefined) {
			app.quit()
			return
		}

		if (folderValid(dir)) {
			settings.set('riotGamesFolder', dir)
		} else {
			dialog.showMessageBoxSync({
				title: 'Error',
				message: 'Tiltseeker failed to find League of Legends installed at the provided location.'
			})
			runSetup()
			return
		}

	}

	if (settings.get('riotGamesFolder') === undefined || !folderValid(settings.get('riotGamesFolder'))) {
		if (folderValid('C:/Riot Games/')) {
			settings.set('riotGamesFolder', 'C:/Riot Games/')
		} else {
			dialog.showMessageBoxSync({
				title: 'Tiltseeker',
				message: "It seems you don't have the League Client installed in the default location. Please select the location of the 'Riot Games' installation folder."
			})
			runSetup()
		}
	}
}
