class WinRateCalc {
  calcProbability(picksAndBans, stats) {
    var {
      champStats,
      matchups
    } = stats;
    matchups = matchups.matchups;
    var teamChamps = Object.values(picksAndBans.allyTeam.picks).map(pick => {
      return pick.championId;
    });
    var opponentChamps = Object.values(picksAndBans.opponentTeam.picks).map(pick => {
      return pick.championId;
    });
    var probabilities = [];
    var samples = 0;

    for (var champA of teamChamps) {
      for (var champB of teamChamps) {
        var [a, b] = [champA, champB].sort((a, b) => a - b);
        var wins = matchups[`${a}w${b}`];
        var total = matchups[`${a}w${b}_total`];
        samples += total;
        probabilities.push(wins / total);
      }
    }

    for (var champA of opponentChamps) {
      for (var champB of opponentChamps) {
        var [a, b] = [champA, champB].sort((a, b) => a - b);
        var wins = matchups[`${a}w${b}`];
        var total = matchups[`${a}w${b}_total`];
        samples += total;
        probabilities.push(1 - wins / total);
      }
    }

    for (var champA of teamChamps) {
      for (var champB of opponentChamps) {
        var [a, b] = [champA, champB].sort((a, b) => a - b);
        var wins = matchups[`${a}v${b}`];
        var total = matchups[`${a}v${b}_total`];
        samples += total;
        var probability = a == champA ? wins / total : 1 - wins / total;
        probabilities.push(probability);
      }
    }

    probabilities = probabilities.filter(val => !isNaN(val));
    return {
      probability: probabilities.reduce((a, b) => a + b, 0) / probabilities.length,
      samples: samples
    };
  }

  getWinRate(picksAndBans, stats, localPlayerCellId, potentialPicks) {
    var returnObj = { ...this.calcProbability(picksAndBans, stats),
      options: {}
    }; // potentialPicks.forEach(champId => {
    // 	var modifiedPicksAndBans = picksAndBans
    // 	modifiedPicksAndBans.allyTeam.picks[localPlayerCellId] = {
    // 		championId: champId,
    // 		completed: false,
    // 	}
    // 	returnObj.options[champId] = this.calcProbability(modifiedPicksAndBans, stats)
    // })

    return returnObj;
  }

}

module.exports = {
  WinRateCalc
};