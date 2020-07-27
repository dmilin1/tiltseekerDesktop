
class WinRateCalc {

	normalize(x) {
		return x / ( 1 + Math.abs( 5 * x ) ) + 0.5
	}

	calcProbability(picksAndBans, stats, compensateForWinrate) {
		var { champStats, matchups } = stats

		var teamChamps = Object.values(picksAndBans.allyTeam.picks).map(pick => {
			return pick.championId
		})

		var opponentChamps = Object.values(picksAndBans.opponentTeam.picks).map(pick => {
			return pick.championId
		})

		var probabilities = []
		var totalSamples = 0

		var minimumSamples = 1000

		for (var [i, champA] of teamChamps.entries()) {
			for (var champB of teamChamps.slice(i + 1)) {
				var [a, b] = [champA, champB].sort((a, b) => a - b)

				var wins = matchups[`${a}w${b}`]
				var total = matchups[`${a}w${b}_total`]

				if (total > minimumSamples) {
					totalSamples += total
					var probability = wins/total

					if (compensateForWinrate) {
						var champAWinRate = matchups[`${a}w${a}`]/matchups[`${a}w${a}_total`]
						var champBWinRate = matchups[`${b}w${b}`]/matchups[`${b}w${b}_total`]
						var avgWinRate = champAWinRate + champBWinRate - 1

						probability -= avgWinRate
					}

					probabilities.push(probability)
				}
			}
		}

		for (var [i, champA] of opponentChamps.entries()) {
			for (var champB of opponentChamps.slice(i + 1)) {
				var [a, b] = [champA, champB].sort((a, b) => a - b)

				var wins = matchups[`${a}w${b}`]
				var total = matchups[`${a}w${b}_total`]

				if (total > minimumSamples) {
					totalSamples += total
					var probability = wins/total
					
					if (compensateForWinrate) {
						var champAWinRate = matchups[`${a}w${a}`]/matchups[`${a}w${a}_total`]
						var champBWinRate = matchups[`${b}w${b}`]/matchups[`${b}w${b}_total`]
						var avgWinRate = champAWinRate + champBWinRate - 1

						probability -= avgWinRate
					}

					probabilities.push(1-probability)
				}
			}
		}

		for (var champA of teamChamps) {
			for (var champB of opponentChamps) {
				var [a, b] = [champA, champB].sort((a, b) => a - b)

				var wins = matchups[`${a}v${b}`]
				var total = matchups[`${a}v${b}_total`]

				if (total > minimumSamples) {
					totalSamples += total
					var probability = a == champA ? wins/total : 1 - wins/total
					
					if (compensateForWinrate) {
						var champAWinRateUncorrected = matchups[`${a}w${a}`]/matchups[`${a}w${a}_total`]
						var champAWinRate = a == champA ? champAWinRateUncorrected : 1 - champAWinRateUncorrected
						var champBWinRateUncorrected = matchups[`${b}w${b}`]/matchups[`${b}w${b}_total`]
						var champBWinRate = a == champA ? 1 - champBWinRateUncorrected : champBWinRateUncorrected
						var avgWinRate = champAWinRate + champBWinRate - 1

						probability -= avgWinRate
					}

					probabilities.push(probability)
				}
			}
		}

		probabilities = probabilities.filter(val => !isNaN(val))

		console.log(probabilities.reduce((a,b) => a + (b - 0.5), 0))
		console.log(probabilities)
		return {
			// probability: probabilities.reduce((a,b) => a + b, 0)/probabilities.length,
			probability: this.normalize(probabilities.reduce((a,b) => a + (b - 0.5), 0) / ( ( teamChamps.length + opponentChamps.length ) / 2 ) ),
			totalSamples: totalSamples,
		}

	}

	getWinRate(picksAndBans, stats, localPlayerCellId, potentialPicks, compensateForWinrate) {
		var returnObj = {
			...this.calcProbability(picksAndBans, stats, compensateForWinrate),
			options: {}
		}
		console.log(picksAndBans)
		console.log(returnObj.probability)

		potentialPicks.forEach(champId => {
			var modifiedPicksAndBans = JSON.parse(JSON.stringify(picksAndBans)) // the JSON stuff quickly makes a deep copy
			modifiedPicksAndBans.allyTeam.picks[localPlayerCellId] = {
				championId: champId,
				completed: false,
			}
			returnObj.options[champId] = this.calcProbability(modifiedPicksAndBans, stats, compensateForWinrate)
		})

		return returnObj
	}
}

module.exports = {
	WinRateCalc,
}
