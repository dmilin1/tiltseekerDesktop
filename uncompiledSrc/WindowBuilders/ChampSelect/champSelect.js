const React = window.require('react')
const ReactDOM = window.require('react-dom')
const { ipcRenderer } = window.require('electron')
const { WindowDataTransfer } = require('./../../DataTransfer/dataTransfer.js')
const { FontAwesomeIcon } = require('@fortawesome/react-fontawesome')
const { faToggleOn, faToggleOff, faTimes } = require('@fortawesome/free-solid-svg-icons')
// const backgroundImg = require('./Resources/Images/background.png')

const axios = require('axios')

const { StyleSheet, css } = window.require('aphrodite')

const e = React.createElement;

class ChampSelect extends React.Component {
  constructor(props) {
    super(props);
		this.state = {
			dataTransfer: new WindowDataTransfer('champSelectWindow', this.dataReceived()),

			compensateForWinrate: false,
			bestChampsOnly: false,
			winRateData: null,
			version: null,
			championData: null,
		}
		this.state.dataTransfer.send('requestSettings')
  }

	componentWillMount() {
		axios.get('https://ddragon.leagueoflegends.com/api/versions.json')
		.then(res => {
			this.setState({ version: res.data[0] })
			return axios.get(`https://ddragon.leagueoflegends.com/cdn/${res.data[0]}/data/en_US/champion.json`)
		})
		.then(res => {
			var championData = res.data.data
			for (var champ of Object.keys(championData)) {
				championData[championData[champ].key] = championData[champ]
			}
			this.setState({ championData: championData })
		})
	}

	dataReceived = () => { return {
		settingsUpdate: (data) => {
			this.setState({
				compensateForWinrate: data.compensateForWinrate,
				bestChampsOnly: data.bestChampsOnly,
			})
		},
		winRateData: (data) => {
			this.setState({
				winRateData: data
			})
		}
	}}

	setSetting = (name, data) => {
		this.state.dataTransfer.send('setSetting', [name, data])
	}

  render() {

		var champList = this.state.winRateData ?
			Object.entries(this.state.winRateData.options).map(arr => {
				return [
					`https://ddragon.leagueoflegends.com/cdn/${this.state.version}/img/champion/${this.state.championData[arr[0]].id}.png`,
					arr[1].probability
				]
			}).sort((a, b) => {
				return b[1] - a[1]
			})
		: []

    return (
			<div
				className={css(styles.body)}
			>
				<img
					className={css(styles.backgroundImg)}
					src={'./Resources/Images/background.png'}
				/>
				<div className={css(styles.edgeText)}>
					{'BEST'}
					<br/>
					{'PICKS'}
				</div>

				<Champions
					data={champList.slice(0, 5)}
				/>

				<CheckBox
					text='Compensate For Champion Winrate'
					value={this.state.compensateForWinrate}
					onClick={(val) => {
						this.setState({ compensateForWinrate: val })
						this.setSetting('compensateForWinrate', val)
					}}
				/>

				<div
					className={css(styles.percentage)}
					style={{ color: 'green' }}
				>
					{this.state.winRateData ?
						(this.state.winRateData.probability*100).toFixed(1) + '%'
						:
						'50.0%'
					}
				</div>

				<div className={css(styles.vsText)}>
					{'VS'}
				</div>

				<div
					className={css(styles.percentage)}
					style={{ color: '#BE0000' }}
				>
					{this.state.winRateData ?
						((1-this.state.winRateData.probability)*100).toFixed(1) + '%'
						:
						'50.0%'
					}
				</div>

				<CheckBox
					text='Suggest My Best Champions Only'
					value={this.state.bestChampsOnly}
					onClick={(val) => {
						this.setState({ bestChampsOnly: val })
						this.setSetting('bestChampsOnly', val)
					}}
				/>

				<Champions
					data={champList.slice(champList.length-5, champList.length)}
				/>

				<div className={css(styles.edgeText)}>
					{'WORST'}
					<br/>
					{'PICKS'}
				</div>
			</div>
    );
  }
}


class CheckBox extends React.Component {
	constructor(props) {
    super(props);
  }

	render() {
		return (
			<div
				className={css(styles.checkBoxContainer)}
				onClick={() => this.props.onClick(!this.props.value)}
			>
				<img
					className={css(styles.checkBoxImg)}
					src={
						this.props.value ?
						'./Resources/Images/checked.png' :
						'./Resources/Images/unchecked.png'
					}
				/>
				<div className={css(styles.checkBoxText)}>
					{this.props.text}
				</div>
			</div>
		)
	}
}


class Champions extends React.Component {
	constructor(props) {
    super(props);
  }

	render() {
		return (
			<div
				className={css(styles.championsContainer)}
				onClick={() => this.props.onClick(!this.props.value)}
			>
				{this.props.data.map((arr) => (
					<div className={css(styles.championContainer)}>
						<div className={css(styles.championImgContainer)}>
							<img
								className={css(styles.championImg)}
								src={arr[0]}
							/>
						</div>
						<div className={css(styles.championWinRateText)}>
							{(arr[1]*100).toFixed(1) + '%'}
						</div>
					</div>
				))}
			</div>
		)
	}
}

const styles = StyleSheet.create({
	body: {
		display: 'flex',
		flexDirection: 'row',
		flex: 1,
		margin: -8,
		alignItems: 'stretch',
		color: '#aaa48a',
	},
	backgroundImg: {
		position: 'absolute',
		zIndex: -1,
		width: '100%',
		height: '100%',
	},
	edgeText: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		textAlign: 'center',
		fontSize: '28vh',
		flex: 0.3,
		fontFamily: 'Roboto-Regular',
	},
	checkBoxContainer: {
		display: 'flex',
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		fontFamily: 'Roboto-Regular',
		cursor: 'pointer',
	},
	percentage: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		flex: 0.25,
		fontSize: '24vh',
		fontFamily: 'Roboto-Bold',
	},
	vsText: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		flex: 0.35,
		fontSize: '32vh',
		fontFamily: 'Roboto-Black',
	},

	championsContainer: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		flex: 1,
	},
	championContainer: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'column',
		flex: 1,
	},
	championImgContainer: {
		borderRadius: 6,
		borderRadius: 5,
		width: '67vh',
		height: '67vh',
		marginLeft: 4,
		marginRight: 4,
		boxShadow: '0px 0px 10px 2px rgb(0, 0, 0, 1)',
	},
	championImg: {
		overflow: 'hidden',
		borderRadius: 5,
		width: '100%',
		height: '100%',
	},
	championWinRateText: {
		color: '#aeaeae',
		fontSize: '20vh',
		fontFamily: 'Roboto-Black',
		marginTop: '1.5vh',
		marginBottom: '-3vh',
	},

	checkBoxImg: {
		width: '18vh',
		height: '18vh',
		paddingRight: '10vh',
	},
	checkBoxText: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		textAlign: 'center',
		fontSize: '24vh',
		width: '200vh',
	},
})


const domContainer = document.querySelector('#root');
ReactDOM.render(e(ChampSelect), domContainer);
