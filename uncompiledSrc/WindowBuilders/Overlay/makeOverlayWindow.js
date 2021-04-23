const { app, BrowserWindow, screen } = require('electron')
const path = require('path')
const Settings = require('./../../Settings/settings.js')
const { GameConfigReader } = require('./../../Utilities/GameConfigReader')
const { ServerDataTransfer } = require('./../../DataTransfer/dataTransfer.js')

const IOverlay = require("electron-overlay")
const IOVhook = require("node-ovhook")

const ioHook = require('iohook')

const { regionConvert } = require('./../../constants.js')

module.exports = async function(clientApi) {

	var gameConfigReader = new GameConfigReader()

	var isInjected = false
	var isShowing = true

	var height = Math.min(gameConfigReader.get('Height'), 2160)
	var width = Math.min(gameConfigReader.get('Width'), 3840)

	scaledHeight = Math.floor( height / screen.getPrimaryDisplay().scaleFactor )
	scaledWidth = Math.floor( width / screen.getPrimaryDisplay().scaleFactor )

	IOverlay.start()

	var settings = new Settings()
	var overlayWindow = new BrowserWindow({
		height: Math.floor(scaledHeight / screen.getPrimaryDisplay().scaleFactor),
		width: scaledWidth,
		frame: false,
		show: false,
		transparent: true,
		webPreferences: {
			nodeIntegration: true,
			offscreen: true,
			preload: path.join(__dirname, 'overlay.js'),
		}
	})

	var prevMouse = screen.getCursorScreenPoint()
	var prevBounds = overlayWindow.getBounds()

	var dataTransfer = new ServerDataTransfer(overlayWindow, 'overlay', {
		getScaling: (data) => {
			dataTransfer.send('setScaling', screen.getPrimaryDisplay().scaleFactor)
		},
		mouseState: (state) => {
			if (state == 'down') {
				clearInterval(this.setWindowPos)
				prevBounds = overlayWindow.getBounds()
				prevMouse = screen.getCursorScreenPoint()
				this.setWindowPos = setInterval(() => {
					currMouse = screen.getCursorScreenPoint()
					xDiff = Math.round(currMouse.x - prevMouse.x)
					yDiff = Math.round(currMouse.y - prevMouse.y)
					newBounds = {
						x: prevBounds.x + xDiff,
						y: prevBounds.y + yDiff,
						width: scaledWidth,
						height: Math.floor(scaledHeight / screen.getPrimaryDisplay().scaleFactor),
					}
					overlayWindow.setBounds(newBounds)
					IOverlay.sendWindowBounds(overlayWindow.id, { rect: {
						x: newBounds.x,
						y: newBounds.y,
						width: width,
						height: scaledHeight,
					} })
				}, 1000/overlayWindow.webContents.frameRate)
			} else {
				clearInterval(this.setWindowPos)
			}
		}
	})

	overlayWindow.setPosition(0, 0)

	var showOverlay = () => {
		if (isShowing) { return }
		isShowing = true
		newBounds = {
			x: prevBounds.x,
			y: prevBounds.y,
			width: scaledWidth,
			height: Math.floor(scaledHeight / screen.getPrimaryDisplay().scaleFactor),
		}
		overlayWindow.setBounds(newBounds)
		IOverlay.sendWindowBounds(overlayWindow.id, { rect: {
			x: prevBounds.x,
			y: prevBounds.y,
			width: width,
			height: scaledHeight,
		}})
		overlayWindow.webContents.invalidate() // forces a repaint
		console.log('showing')
	}

	var hideOverlay = () => {
		if (!isShowing) { return }
		isShowing = false
		prevBounds = overlayWindow.getBounds()
		IOverlay.sendWindowBounds(overlayWindow.id, { rect: {
			x: -1,
			y: -1,
			width: 0,
			height: 0,
		}})
		console.log('hiding')
	}

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
			if (settings.get('hotkeyIsToggle') && isShowing) {
				hideOverlay()
			} else {
				showOverlay()
			}
		}
	})

	ioHook.on('keyup', event => {
		if (event.rawcode == settings.get('hotkey').rawcode) {
			if (!settings.get('hotkeyIsToggle')) {
				hideOverlay()
			}
		}
	})

	ioHook.start()


	loadGame = async () => {
		username = (await clientApi.get('/lol-summoner/v1/current-summoner')).displayName
		region = regionConvert[(await clientApi.get('/riotclient/get_region_locale')).region]
		overlayWindow.loadURL(`https://tiltseeker.com/tiltseek?region=${region}&summonerName=${encodeURIComponent(username)}&desktop=true`)
		showOverlay()
		console.log('loading game')
		console.log(`https://tiltseeker.com/tiltseek?region=${region}&summonerName=${encodeURIComponent(username)}&desktop=true`)
	}

	clientApi.subscribe('/lol-gameflow/v1/gameflow-phase', async (phase) => {
		console.log(phase)
		if (phase == 'InProgress') {
			loadGame()
		}
	})

	overlayWindow.webContents.frameRate = 10
	overlayWindow.loadURL(`https://tiltseeker.com/?desktop=true`)
	// overlayWindow.loadURL(`https://tiltseeker.com/tiltseek?region=na1&summonerName=forsen&desktop=true`)
	// overlayWindow.loadURL(`https://tiltseeker.com/bestbans?desktop=true`)
	
	IOverlay.addWindow(overlayWindow.id, {
		name: 'derp',
		transparent: true,
		resizable: false,
		maxWidth: width,
		maxHeight: scaledHeight,
		minWidth: width,
		minHeight: scaledHeight,
		nativeHandle: overlayWindow.getNativeWindowHandle().readUInt32LE(0),
		rect: {
			x: 0,
			y: 0,
			width: width,
			height: scaledHeight,
		},
		caption: {
			left: 0,
			right: 0,
			top: 0,
			height: 0,
		},
		dragBorderWidth: 0,
		alwaysIgnoreInput: false,
		alwaysOnTop: true,
	})

	overlayWindow.webContents.on('paint', (event, dirty, image) => {
		IOverlay.sendFrameBuffer(
			overlayWindow.id,
			image.getBitmap(),
			image.getSize().width,
			image.getSize().height,
		)
	})

	// overlayWindow.on("resize", () => {
	// 	IOverlay.sendWindowBounds(overlayWindow.id, { rect: overlayWindow.getBounds() })
	// })

	// overlayWindow.on("move", () => {
	// 	console.log('MOVED')
	// 	IOverlay.sendWindowBounds(overlayWindow.id, { rect: overlayWindow.getBounds() })
	// })

	overlayWindow.webContents.on("cursor-changed", (event, type) => {
		var cursor = ''
		switch (type) {
			case "default":
				cursor = "IDC_ARROW"
				break
			case "pointer":
				cursor = "IDC_HAND"
				break
			case "crosshair":
				cursor = "IDC_CROSS"
				break
			case "text":
				cursor = "IDC_IBEAM"
				break
			case "wait":
				cursor = "IDC_WAIT"
				break
			case "help":
				cursor = "IDC_HELP"
				break
			case "move":
				cursor = "IDC_SIZEALL"
				break
			case "nwse-resize":
				cursor = "IDC_SIZENWSE"
				break
			case "nesw-resize":
				cursor = "IDC_SIZENESW"
				break
			case "ns-resize":
				cursor = "IDC_SIZENS"
				break
			case "ew-resize":
				cursor = "IDC_SIZEWE"
				break
			case "none":
				cursor = ""
				break
		}
		if (cursor) {
			IOverlay.sendCommand({ command: "cursor", cursor })
		}
	})

	IOverlay.setEventCallback((event, payload) => {
		if (event == 'game.input') {
			var scaleFactor = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).scaleFactor
			// payload.lparam is a 32 bit value. The HIWORD is y value, the LOWORD is x value
			x = ( payload.lparam & 0x0000FFFF ) / scaleFactor
			y = ( payload.lparam >>> 16 ) / scaleFactor
			payload.lparam = x + ( y << 16 )
			overlayWindow.webContents.sendInputEvent(IOverlay.translateInputEvent(payload))
		}
	})

	setInterval(() => {
		console.log('checking')
		var window = IOVhook.getTopWindows().reduce((prev, window) => {
			if (prev) {
				return prev
			} else if (window.title?.toLowerCase() == 'League of Legends (TM) Client'.toLowerCase()) {
				return window
			}
			return null
		}, null)
		if (!window && isInjected) {
			isInjected = false
			console.log('Window closed.')
		}
		if (window && !isInjected) {
			console.log('Window found. Injecting...')
			IOVhook.injectProcess(window, {
				dllPath: path.join(__dirname, "/dist/n_overlay.dll"),
				dllPath64: path.join(__dirname, "/dist/n_overlay.x64.dll"),
				helper: path.join(__dirname, "/dist/n_ovhelper.exe"),
				helper64: path.join(__dirname, "/dist/n_ovhelper.x64.exe")
			})
			isInjected = true
		}
	}, 5000)

	return overlayWindow
}
