const {
  execFile
} = require('child_process');

const getPort = require('get-port');

var ipc = require('node-ipc');

class WindowManager {
  constructor(callback, timer = 10) {
    this.state = {
      child: null,
      currentPosition: {
        widthHeight: [null, null],
        topLeft: [null, null],
        bottomRight: [null, null]
      },
      timer: timer,
      callback: callback
    };
  }

  async start() {
    if (this.state.child == null) {
      var port = await getPort();
      ipc.config.networkPort = port;
      ipc.config.rawBuffer = true;
      ipc.config.silent = true;
      ipc.serveNet('127.0.0.1', port, () => {
        ipc.server.on('data', (data, socket) => {
          if (data.toString() === 'background') {
            this.tryToUpdateBounds(null);
          } else {
            var [y1, x1, y2, x2] = data.toString().split(', ').map(val => Number(val));
            var newPosition = {
              widthHeight: [x2 - x1, y2 - y1],
              topLeft: [x1, y1],
              bottomRight: [x2, y2]
            };
            this.tryToUpdateBounds(this.verifyBounds(newPosition));
          }
        }); // ipc.server.on(
        // 	'connect',
        // 	(data, socket) => {
        // 		console.log('connection has been made')
        // 	}
        // )

        this.state.child = execFile('windowManagerHelper.exe', [port, this.state.timer], {
          cwd: __dirname
        });
      });
      ipc.server.start();
    }
  }

  stop() {
    if (this.state.child) {
      this.state.child.kill();
      this.state.child = null;
    }
  }

  setCallback(callback) {
    this.state.callback = callback;
  }

  verifyBounds(bounds) {
    var {
      topLeft,
      bottomRight,
      widthHeight
    } = bounds;

    if (topLeft[0] < -1000 && topLeft[1] < -1000 && bottomRight[0] < -1000 && bottomRight[1] < -1000 || widthHeight[0] > 10000 || widthHeight[1] > 10000) {
      return null;
    } else {
      return bounds;
    }
  }

  tryToUpdateBounds(newPosition) {
    var changed = false;

    if (newPosition == null && this.state.currentPosition.bottomRight[0] != null) {
      this.state.currentPosition = {
        widthHeight: [null, null],
        topLeft: [null, null],
        bottomRight: [null, null]
      };
      changed = true;
    }

    if (newPosition != null && (this.state.currentPosition.bottomRight[0] != newPosition.bottomRight[0] || this.state.currentPosition.bottomRight[1] != newPosition.bottomRight[1])) {
      this.state.currentPosition = newPosition;
      changed = true;
    }

    if (changed) {
      if (this.state.currentPosition.widthHeight[0] == null || this.state.currentPosition.topLeft[0] == null || this.state.currentPosition.bottomRight[0] == null) {
        this.state.callback(null);
      } else {
        this.state.callback(this.state.currentPosition);
      }
    }
  }

  startWatching() {
    this.state.child.stdout.on('data', output => {
      if (output.includes('background')) {
        this.tryToUpdateBounds(null);
      } else if (output.includes('LeagueClientUx')) {
        var data = output.replace('\\r\\n', '').split(/ +/);
        var topLeft = data[1].split(',').map(val => Number(val));
        var bottomRight = data[2].split(',').map(val => Number(val));
        var newPosition = {
          widthHeight: [bottomRight[0] - topLeft[0], bottomRight[1] - topLeft[1]],
          topLeft: topLeft,
          bottomRight: bottomRight
        };

        if (topLeft[0] < -1000 && topLeft[1] < -1000 && bottomRight[0] < -1000 && bottomRight[1] < -1000 || isNaN(newPosition.widthHeight[0]) || isNaN(newPosition.widthHeight[1]) || isNaN(topLeft[0]) || isNaN(topLeft[1]) || isNaN(bottomRight[0]) || isNaN(bottomRight[1])) {
          this.tryToUpdateBounds(null);
        } else {
          this.tryToUpdateBounds(newPosition);
        }
      }
    });
    this.state.child.stderr.on('data', output => {
      this.tryToUpdateBounds(null);
    });
  }

}

module.exports = {
  WindowManager
};