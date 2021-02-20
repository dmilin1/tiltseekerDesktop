const { app } = require('electron')
const Store = require('electron-store')
const path = require('path')
const fs = require('fs')


module.exports = class Settings {

	defaults = {
		runAtStart: true,
		compensateForWinrate: false,
		bestChampsOnly: false,
		bestChampsWhitelist: [],
		lanesToShow: ['top', 'jungle', 'middle', 'bottom', 'support'],
		bestChampsLimit: 20,
		hotkeyIsToggle: false,
		hotkey: {
			shiftKey: false,
			altKey: false,
			ctrlKey: false,
			metaKey: false,
			keycode: 12,
			rawcode: 189,
			type: 'keydown'
		},
	}

	constructor() {
		this.store = new Store()
		this.setUnsetSettings()
	}

	// sets any default settings values that are undefined
	setUnsetSettings = () => {
		for (var [key, value] of Object.entries(this.defaults)) {
			if (this.get(key) === undefined) {
				this.set(key, value)
			}
		}
	}

	get = (key) => {
		return this.store.get(key)
	}

	set = (key, val) => {
		if (key === 'runAtStart') {
			this.runAtStart(val)
		}
		return this.store.set(key, val)
	}

	getCurrentSettings = () => {
		return this.store.store
	}

	runAtStart = (val) => {
		const appFolder = path.dirname(process.execPath)
		const updateExe = path.resolve(appFolder, '..', 'Update.exe')
		const exeName = path.basename(process.execPath)

		app.setLoginItemSettings({
			openAtLogin: val,
			path: updateExe,
			args: [
				'--processStart', `"${exeName}"`,
				'--process-start-args', `"--hidden"`
			]
		})
		console.log('Run at startup set to: ' + val)
	}
}
