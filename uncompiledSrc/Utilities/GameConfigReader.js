const Settings = require('../Settings/settings')
const fs = require('fs')

class GameConfigReader {
	constructor() {
		this.settings = new Settings()
		this.loadConfig()
	}

	loadConfig() {
		if (!this.settings.get('riotGamesFolder')) {
			throw Error("Riot Games folder hasn't been set yet. This shouldn't be possible.")
		}
		this.config = {}
		fs.readFileSync(this.settings.get('riotGamesFolder') + '/League of Legends/Config/game.cfg', 'utf8').split(/\r\n|\n/).forEach(line => {
			var data = line.split('=')
			if (data.length < 2) { return }
			this.config[data[0]] = isNaN(Number(data[1])) ? data[1] : Number(data[1])
		})
	}
	
	get(name) {
		return this.config[name]
	}
}

module.exports = {
	GameConfigReader,
}
