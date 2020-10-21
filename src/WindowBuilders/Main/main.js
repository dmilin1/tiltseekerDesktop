const React = window.require('react');

const ReactDOM = window.require('react-dom');

const {
  ipcRenderer
} = window.require('electron');

const {
  WindowDataTransfer
} = require('./../../DataTransfer/dataTransfer.js');

const keycodeToName = require('../../Utilities/KeycodeToName');

const {
  FontAwesomeIcon
} = require('@fortawesome/react-fontawesome');

const {
  faToggleOn,
  faToggleOff,
  faTimes
} = require('@fortawesome/free-solid-svg-icons');

const {
  StyleSheet,
  css
} = window.require('aphrodite');

const e = React.createElement;

class Settings extends React.Component {
  constructor(props) {
    super(props);

    this.dataReceived = () => {
      return {
        settingsUpdate: data => {
          this.setState({
            settingsData: data
          });
          this.hotkeyInput.blur();
        }
      };
    };

    this.getHotkey = () => {
      this.state.dataTransfer.send('getHotkey');
    };

    this.exitPressed = () => {
      this.state.dataTransfer.send('exitPressed');
    };

    this.toggleRunAtStart = () => {
      this.state.dataTransfer.send('toggleRunAtStart');
    };

    this.toggleHotkeyIsToggle = () => {
      this.state.dataTransfer.send('toggleHotkeyIsToggle');
    };

    this.setBestChampsLimit = num => {
      this.state.dataTransfer.send('setBestChampsLimit', num);
    };

    this.state = {
      dataTransfer: new WindowDataTransfer('mainWindow', this.dataReceived()),
      settingsData: null
    };
    this.state.dataTransfer.send('requestSettings');
  }

  render() {
    return React.createElement(React.Fragment, null, React.createElement("div", {
      className: css(styles.body)
    }, this.state.settingsData ? React.createElement(React.Fragment, null, React.createElement("div", {
      className: css(styles.title)
    }, 'Settings'), React.createElement("div", {
      className: css(styles.settingsContainer)
    }, React.createElement("div", {
      className: css(styles.runAtStart),
      onClick: () => {
        this.toggleRunAtStart();
      }
    }, 'Automatically Run At Startup: ', this.state.settingsData.runAtStart ? React.createElement(FontAwesomeIcon, {
      icon: faToggleOn
    }) : React.createElement(FontAwesomeIcon, {
      icon: faToggleOff
    })), React.createElement("div", {
      className: css(styles.runAtStart),
      onClick: () => {
        this.toggleHotkeyIsToggle();
      }
    }, 'Overlay Hotkey is Toggle: ', this.state.settingsData.hotkeyIsToggle ? React.createElement(FontAwesomeIcon, {
      icon: faToggleOn
    }) : React.createElement(FontAwesomeIcon, {
      icon: faToggleOff
    })), React.createElement("div", {
      className: css(styles.bestChampsLimitContainer)
    }, 'Best Champs Limit: ', React.createElement("input", {
      className: css(styles.bestChampsLimitInput),
      value: this.state.settingsData.bestChampsLimit,
      onChange: e => this.setBestChampsLimit(e.target.value)
    })), React.createElement("div", {
      className: css(styles.hotkeyContainer)
    }, 'Hotkey: ', React.createElement("input", {
      className: css(styles.hotkeyInput),
      ref: me => this.hotkeyInput = me,
      value: keycodeToName(this.state.settingsData.hotkey.rawcode) + (this.state.settingsData.hotkey.shiftKey ? ' + shift' : '') + (this.state.settingsData.hotkey.altKey ? ' + alt' : '') + (this.state.settingsData.hotkey.ctrlKey ? ' + ctrl' : '') + (this.state.settingsData.hotkey.metaKey ? ' + meta' : ''),
      onFocus: () => {
        this.getHotkey();
      },
      onBlur: () => {// ioHook.stop()
      }
    })))) : null), React.createElement("div", {
      className: css(styles.exitButton),
      onClick: this.exitPressed
    }, React.createElement("div", {
      className: css(styles.exitButtonIcon)
    }, React.createElement(FontAwesomeIcon, {
      icon: faTimes
    }))));
  }

}

const styles = StyleSheet.create({
  body: {
    display: 'flex',
    backgroundColor: '#686868',
    flex: 1,
    margin: 25,
    alignItems: 'stretch',
    flexDirection: 'column',
    borderRadius: 10,
    borderStyle: 'solid',
    borderWidth: 2,
    borderColor: '#C8C8C8',
    WebkitAppRegion: 'drag'
  },
  exitButton: {
    position: 'absolute',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 25,
    width: 25,
    backgroundColor: 'grey',
    borderRadius: 50,
    top: 20,
    right: 20,
    zIndex: 1,
    borderStyle: 'solid',
    borderWidth: 2,
    borderColor: '#C8C8C8',
    WebkitAppRegion: 'no-drag'
  },
  exitButtonIcon: {
    marginTop: 2,
    marginRight: 0,
    fontSize: 12,
    userSelect: 'none',
    WebkitAppRegion: 'no-drag'
  },
  title: {
    paddingTop: 30,
    textAlign: 'center',
    fontSize: 60,
    fontFamily: 'Roboto-Bold',
    stroke: 'white',
    strokeWidth: 3,
    webkitTextStrokeWidth: 3,
    webkitTextStrokeColor: 'white',
    textShadow: '0 0 5px #BBB'
  },
  settingsContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly'
  },
  runAtStart: {
    fontSize: 25,
    fontFamily: 'Roboto-Regular',
    color: '#0C0C0C',
    WebkitAppRegion: 'no-drag',
    cursor: 'pointer'
  },
  hotkeyContainer: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 25,
    fontFamily: 'Roboto-Regular',
    color: '#0C0C0C'
  },
  hotkeyInput: {
    WebkitAppRegion: 'no-drag',
    height: 25,
    width: 230,
    marginBottom: -2,
    marginLeft: 12,
    textAlign: 'center',
    color: 'white',
    backgroundColor: '#333',
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: '#DDD',
    outline: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.25s, border-color 0.25s, color 0.25s',
    ':focus': {
      borderColor: '#151515',
      backgroundColor: '#333'
    },
    ':hover': {
      borderColor: '#151515',
      backgroundColor: '#333'
    },
    '::selection': {
      backgroundColor: '#CCC'
    }
  },
  bestChampsLimitContainer: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 25,
    fontFamily: 'Roboto-Regular',
    color: '#0C0C0C'
  },
  bestChampsLimitInput: {
    WebkitAppRegion: 'no-drag',
    height: 25,
    width: 230,
    marginBottom: -2,
    marginLeft: 12,
    textAlign: 'center',
    color: 'white',
    backgroundColor: '#333',
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: '#DDD',
    outline: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.25s, border-color 0.25s, color 0.25s',
    ':focus': {
      borderColor: '#151515',
      backgroundColor: '#333'
    },
    ':hover': {
      borderColor: '#151515',
      backgroundColor: '#333'
    },
    '::selection': {
      backgroundColor: '#CCC'
    }
  }
});
const domContainer = document.querySelector('#root');
ReactDOM.render(e(Settings), domContainer);