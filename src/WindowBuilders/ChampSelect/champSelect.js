const React = window.require('react');

const ReactDOM = window.require('react-dom');

const {
  ipcRenderer
} = window.require('electron');

const {
  WindowDataTransfer
} = require('./../../DataTransfer/dataTransfer.js');

const {
  FontAwesomeIcon
} = require('@fortawesome/react-fontawesome');

const {
  faToggleOn,
  faToggleOff,
  faTimes,
  faArrowLeft
} = require('@fortawesome/free-solid-svg-icons'); // const backgroundImg = require('./Resources/Images/background.png')


const axios = require('axios');

const {
  StyleSheet,
  css
} = window.require('aphrodite');

const e = React.createElement;

class ChampSelect extends React.Component {
  constructor(props) {
    super(props);

    this.dataReceived = () => {
      return {
        settingsUpdate: data => {
          this.setState({
            compensateForWinrate: data.compensateForWinrate,
            bestChampsOnly: data.bestChampsOnly,
            lanesToShow: data.lanesToShow
          });
        },
        winRateData: data => {
          this.setState({
            winRateData: data
          });
        },
        influenceRateData: data => {
          this.setState({
            influenceRateData: data
          });
        },
        setStage: data => {
          this.setStage(data);
        }
      };
    };

    this.setSetting = (name, data) => {
      this.state.dataTransfer.send('setSetting', [name, data]);
    };

    this.setStage = stage => {
      this.oldStage = this.state.stage;
      this.setState({
        stage
      });
    };

    this.prevStage = () => {
      var tempStage = this.oldStage;
      this.oldStage = this.state.stage;
      this.setState({
        stage: tempStage
      });
    };

    this.state = {
      dataTransfer: new WindowDataTransfer('champSelectWindow', this.dataReceived()),
      compensateForWinrate: false,
      bestChampsOnly: false,
      lanesToShow: [],
      winRateData: null,
      influenceRateData: null,
      version: null,
      championData: null,
      stage: 'picks' // can also be bans or settings

    };
    this.state.dataTransfer.send('requestSettings');
  }

  componentWillMount() {
    axios.get('https://ddragon.leagueoflegends.com/api/versions.json').then(res => {
      this.setState({
        version: res.data[0]
      });
      return axios.get(`https://ddragon.leagueoflegends.com/cdn/${res.data[0]}/data/en_US/champion.json`);
    }).then(res => {
      var championData = res.data.data;

      for (var champ of Object.keys(championData)) {
        championData[championData[champ].key] = championData[champ];
      }

      this.setState({
        championData: championData
      });
    });
  }

  render() {
    var champList = [];

    if (this.state.stage == 'picks' && this.state.winRateData) {
      champList = Object.entries(this.state.winRateData.options).map(arr => [`https://ddragon.leagueoflegends.com/cdn/${this.state.version}/img/champion/${this.state.championData[arr[0]].id}.png`, arr[1].probability]).sort((a, b) => {
        return b[1] - a[1];
      });
    } else if (this.state.stage == 'bans' && this.state.influenceRateData) {
      champList = Object.entries(this.state.influenceRateData).map(arr => [`https://ddragon.leagueoflegends.com/cdn/${this.state.version}/img/champion/${this.state.championData[arr[0]].id}.png`, arr[1].influence / 10000]).sort((a, b) => {
        return b[1] - a[1];
      });
    }

    return React.createElement("div", {
      className: css(styles.body)
    }, React.createElement("img", {
      className: css(styles.backgroundImg),
      src: `./Resources/Images/${this.state.stage == 'bans' ? 'background_bans' : 'background'}.png`
    }), this.state.stage == 'settings' ? React.createElement(Settings, {
      prevStage: this.prevStage,
      setSetting: this.setSetting,
      bestChampsOnly: this.state.bestChampsOnly,
      lanesToShow: this.state.lanesToShow
    }) : React.createElement(React.Fragment, null, React.createElement("div", {
      className: css(styles.edgeText)
    }, 'BEST', React.createElement("br", null), this.state.stage == 'bans' ? 'BANS' : 'PICKS'), React.createElement(Champions, {
      data: champList.slice(0, 5),
      stage: this.state.stage
    }), React.createElement(CheckBox, {
      text: "Compensate For Champion Winrate",
      value: this.state.compensateForWinrate,
      onClick: val => {
        this.setSetting('compensateForWinrate', val);
      }
    }), React.createElement("div", {
      className: css(styles.percentage),
      style: {
        color: 'green'
      }
    }, this.state.winRateData ? (this.state.winRateData.probability * 100).toFixed(1) + '%' : '50.0%'), React.createElement("div", {
      className: css(styles.vsText)
    }, 'VS'), React.createElement("div", {
      className: css(styles.percentage),
      style: {
        color: '#BE0000'
      }
    }, this.state.winRateData ? ((1 - this.state.winRateData.probability) * 100).toFixed(1) + '%' : '50.0%'), React.createElement(CheckBox, {
      text: "More Settings",
      value: this.state.bestChampsOnly,
      noCheckBox: true,
      onClick: val => {
        this.setStage('settings');
      }
    }), React.createElement(Champions, {
      data: champList.slice(champList.length - 5, champList.length),
      stage: this.state.stage
    }), React.createElement("div", {
      className: css(styles.edgeText)
    }, 'WORST', React.createElement("br", null), this.state.stage == 'bans' ? 'BANS' : 'PICKS')));
  }

}

class Settings extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return React.createElement(React.Fragment, null, React.createElement(CheckBox, {
      text: React.createElement(FontAwesomeIcon, {
        icon: faArrowLeft
      }),
      value: this.props.bestChampsOnly,
      noCheckBox: true,
      textStyle: {
        fontSize: '70vh'
      },
      onClick: val => {
        this.props.prevStage();
      }
    }), React.createElement(CheckBox, {
      text: "Suggest My Best Champions Only",
      value: this.props.bestChampsOnly,
      onClick: val => {
        this.props.setSetting('bestChampsOnly', val);
      }
    }), ['top', 'jungle', 'middle', 'bottom', 'support'].map(pos => React.createElement(CheckBox, {
      text: React.createElement("img", {
        className: css(styles.laneImg),
        src: `./Resources/Images/lanes/${pos}.webp`
      }),
      value: this.props.lanesToShow.includes(pos),
      noCheckBox: true,
      textStyle: {
        fontSize: '80vh'
      },
      imageStyle: {
        filter: this.props.lanesToShow.includes(pos) ? 'brightness(100%)' : 'brightness(25%)'
      },
      onClick: val => {
        if (this.props.lanesToShow.includes(pos)) {
          this.props.setSetting('lanesToShow', this.props.lanesToShow.filter(lane => lane != pos));
        } else {
          this.props.setSetting('lanesToShow', this.props.lanesToShow.concat([pos]));
        }
      }
    })));
  }

}

class CheckBox extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return React.createElement("div", {
      className: css(styles.checkBoxContainer),
      style: Object.assign({}, this.props.imageStyle),
      onClick: () => this.props.onClick(!this.props.value)
    }, !this.props.noCheckBox ? React.createElement("img", {
      className: css(styles.checkBoxImg),
      src: this.props.value ? './Resources/Images/checked.png' : './Resources/Images/unchecked.png'
    }) : null, React.createElement("div", {
      className: css(styles.checkBoxText),
      style: Object.assign({
        fontSize: '24vh'
      }, this.props.textStyle)
    }, this.props.text));
  }

}

class Champions extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return React.createElement("div", {
      className: css(styles.championsContainer),
      onClick: () => this.props.onClick(!this.props.value)
    }, this.props.data.map(arr => React.createElement("div", {
      className: css(styles.championContainer)
    }, React.createElement("div", {
      className: css(styles.championImgContainer)
    }, React.createElement("img", {
      className: css(styles.championImg),
      src: arr[0]
    })), React.createElement("div", {
      className: css(styles.championWinRateText)
    }, (this.props.stage == 'bans' && arr[1] >= 0 ? '+' : '') + (arr[1] * 100).toFixed(this.props.stage == 'bans' ? 2 : 1) + '%'))));
  }

}

const styles = StyleSheet.create({
  body: {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
    margin: -8,
    alignItems: 'stretch',
    color: '#aaa48a'
  },
  backgroundImg: {
    position: 'absolute',
    zIndex: -1,
    width: '100%',
    height: '100%'
  },
  edgeText: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    fontSize: '28vh',
    flex: 0.3,
    fontFamily: 'Roboto-Regular'
  },
  checkBoxContainer: {
    display: 'flex',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Roboto-Regular',
    cursor: 'pointer'
  },
  percentage: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.25,
    fontSize: '24vh',
    fontFamily: 'Roboto-Bold'
  },
  vsText: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.35,
    fontSize: '32vh',
    fontFamily: 'Roboto-Black'
  },
  championsContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1
  },
  championContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    flex: 1
  },
  championImgContainer: {
    borderRadius: 6,
    borderRadius: 5,
    width: '67vh',
    height: '67vh',
    marginLeft: 4,
    marginRight: 4,
    boxShadow: '0px 0px 10px 2px rgb(0, 0, 0, 1)'
  },
  championImg: {
    overflow: 'hidden',
    borderRadius: 5,
    width: '100%',
    height: '100%'
  },
  championWinRateText: {
    color: '#aeaeae',
    fontSize: '20vh',
    fontFamily: 'Roboto-Black',
    marginTop: '1.5vh',
    marginBottom: '-3vh'
  },
  checkBoxImg: {
    width: '18vh',
    height: '18vh',
    paddingRight: '10vh'
  },
  checkBoxText: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    width: '200vh',
    ':hover': {
      color: '#c9c6b5'
    }
  },
  laneImg: {
    width: '60vh',
    height: '60vh',
    ':hover': {
      filter: 'contrast(150%)'
    }
  }
});
const domContainer = document.querySelector('#root');
ReactDOM.render(e(ChampSelect), domContainer);