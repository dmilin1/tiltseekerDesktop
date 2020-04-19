const path = require('path')
const Settings = require('./../Settings/settings.js')
const fs = require('fs')
const WebSocket = require('ws')
const axios = require('axios')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const messageTypes = {
	WELCOME: 0,
	PREFIX: 1,
	CALL: 2,
	CALLRESULT: 3,
	CALLERROR: 4,
	SUBSCRIBE: 5,
	UNSUBSCRIBE: 6,
	PUBLISH: 7,
	EVENT: 8
}

class ClientApi {
	constructor() {
		var settings = new Settings()
		this.state = {
			settings: settings,
			connected: false,
			lockfile: settings.get('riotGamesFolder') + '/League of Legends/lockfile',
			connection: null,
			subscriptions: {},
			apiCallsWaiting: [],
			connectionInfo: {
				protocol: null,
				port: null,
				password: null,
			},
		}
		fs.watchFile(this.state.lockfile, () => this.tryToConnect())
		this.tryToConnect()
	}

	subscribe(api, callback) {
		if (this.state.subscriptions[api]) {
			this.state.subscriptions[api].push(callback)
		} else {
			this.state.subscriptions[api] = [callback]
		}
		this.get(api).then((res) => callback(res)).catch(err => {})
	}

	didConnect() {
		this.state.connected = true
		for (var func of this.state.apiCallsWaiting) {
			func()
		}
	}

	didDisconnect() {
		this.state.connected = false
	}

	tryToConnect() {
		if (!fs.existsSync(this.state.lockfile)) {
			return
		}
		var lockfileChunks = fs.readFileSync(this.state.lockfile, 'utf8').split(':')
		var port = lockfileChunks[2]
		var password = lockfileChunks[3]
		var protocol = lockfileChunks[4]

		this.state.connectionInfo = {
			protocol: protocol,
			port: port,
			password: password,
		}

		var connection = new WebSocket(`ws${protocol === 'https' ? 's' : ''}://127.0.0.1:${port}`, {
			headers: {
				'Authorization': 'Basic ' +
				Buffer.from('riot:' + password).toString('base64')
			},
			rejectUnauthorized: false
		})

		connection
		.on('open', () => {
			console.log('opened')
			this.didConnect()
			connection.send(JSON.stringify([5, 'OnJsonApiEvent']))
		})
		.on('close', (code) => {
			console.log('closed: ' + code)
			this.didDisconnect()
		})
		.on('error', (err) => {
			console.log('error: ' + err)
			this.didDisconnect()
		})
		.on('message', (msg) => {
			try {
				msg = JSON.parse(msg)
				if (this.state.subscriptions[msg[2].uri]) {
					for (var func of this.state.subscriptions[msg[2].uri]) {
						func(msg[2].data)
					}
				}
			} catch {

			}
		})
	}

	async get(api) {
		var theApiCall = async () => {
			return (await axios.get(`${this.state.connectionInfo.protocol}://127.0.0.1:${this.state.connectionInfo.port}${api}`, {
				headers: {
					'Authorization': 'Basic ' +
					Buffer.from('riot:' + this.state.connectionInfo.password).toString('base64')
				}
			})).data
		}

		return new Promise(async (resolve, reject) => {
			if (this.state.connected) {
				try {
					resolve(await theApiCall())
				} catch (err) {
					reject(err)
				}
			} else {
				this.state.apiCallsWaiting.push(async () => {
					try {
						resolve(await theApiCall())
					} catch (err) {
						reject(err)
					}
				})
			}
		})
	}
}

module.exports = {
	ClientApi,
}
