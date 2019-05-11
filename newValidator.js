'use strict';

var dex = require('./typeslist.js').dex;
const newFairies = ['clefairy', 'clefable', 'cleffa', 'togepi', 'snubbull', 'granbull', 'togetic', 'togekiss', 'azumarill']; //based on bulbapedia "fairy-type" page
const LTMtypes = ['fire', 'fairy', 'rock', 'ice', 'electric', 'grass', 'poison', 'ghost']; //definitely needs updating for this gen
//or even just not being used tbh

class battle {
	constructor(p1, p2, battleID) {
		this.battleID = battleID;
		this.players = [p1, p2];
		this.teams = [[],[]];
		this.types = [];
		this.hasTeamPreview = false; //must be set by parser.js
		this.megaEvos = ['', ''];
		this.watching = false;
	}
	getTypes(playerno, gen) {
        //TODO: add in pre-gen6 stuff like toge
        //but that's something to worry about later
		var player = this.players[playerno];
        var team = this.teams[playerno];
		debug('checking team: ' + team + ' belonging to player: ' + player);
		if (!team.length) {
			error(this.battleID + ': Tried to find type for player ' + player + ' who has no pokemon');
			return false;
		}
		var nonarc = false;

		for (var i = 0; i < team.length; i++) {
            if (team[i] === 'arceus' || team[i] === 'silvally') continue;
            var types;
            var newtypes = [];
            var thistypes = dex[team[i]];
            if (!thistypes) {
                error('Failed to find types of pokemon ' + team[i] + ' for player ' + player);
                continue;
            }
            nonarc = true;
            if (!types) {
                types = thistypes;
                continue;
            }
            for (var j = 0; j < thistypes.length; j++) {
                if (types.indexOf(thistypes[j]) !== -1) newtypes.push(thistypes[j]);
            }
            if (!newtypes.length) return [];
            types = newtypes;
        }
        
        if (!nonarc) {
            error('Failed to find any of the pokemon types in battle ' + this.battleID);
            error('Team was: ' + team);
            return false;
        }
		return types;
	}

	leave() {
		if (!this.watching) {
			error(this.battleID + ': tried to leave when already left.');
			return;
		}
		send(this.battleID + '|/part');
		this.watching = false;
        try {
            delete teamValidator.currentBattles[this.battleID];
        } catch (e) {
            error('Failed to delete internal object for battle ' + this.battleID);
        }
	}
}

exports.teamValidator = {
	currentMeta: '',
	currentBattles: {}, //format is {battleID: <battle object>}
	createBattle: function (player1, player2, battleID) {
		if (battleID.indexOf('monotype') > -1 && !(this.currentMeta === 'uu' || Tours.isMonothreat || Tours.isLTM ))
			return ok('not checking  teams in: ' + battleID + ' (standard mono)');
		this.currentBattles[battleID] = new battle(player1, player2, battleID);
		send('|/join ' + battleID);
		ok('Joined battle ' + battleID);
		this.currentBattles[battleID].watching = true;
	},
	addPokemon: function (battleID, playerNum, pokemon) {
		if(!this.currentBattles[battleID]) return error(battleID + ': tried adding pokemon for nonexistent battle');
		if(playerNum==='p1') this.currentBattles[battleID].teams[0].push(pokemon);
		if(playerNum==='p2') this.currentBattles[battleID].teams[1].push(pokemon);
	},
	onBattleStart: function (battleID) {
		if (!this.currentBattles[battleID]) {
            if (Date.now()/1000 - connect_time < 3600) return send('|/leave ' + battleID);
            //rejoined during tour
            error(battleID + ': battle does not exist');
            return send('|/leave ' + battleID);
        }
		if (!this.currentBattles[battleID].hasTeamPreview) {
			error(battleID + ': battle does not have team preview.');
            try {
                this.currentBattles[battleID].leave();
            } catch (e) {
                send('|/leave ' + battleID);
            }
            return;
		}
		if (!this.currentMeta) return info(battleID + ': saw battle start but not in a tour.'); //IDK if I should put in a send('|/leave') here

		var problems = [];
		var to_dq = [false, false];
		for (var i = 0; i < 2; i++) {
			var this_types = this.currentBattles[battleID].getTypes(i, 7);
			info('types found: ' + this_types)
			if (this_types === false) {
				error(this.currentBattles[battleID].players[i] + '\'s team resulted in the validator returning false');
                //should probably message me that something went wrong here
                //but owell
				continue;
			}
			if (Tours.isMonothreat) {
                var validMonothreat = false;
                for (var j = 0; j < this_types.length; j++) {
                    if (this_types[j].toLowerCase() == Tours.monothreatType) {
                        validMonothreat = true;
                        break;
                    }
                }
                if (!validMonothreat) {
                    info('Monothreat type: ' + Tours.monothreatType + '. Player\'s types: ' + this_types);
					problems.push(this.currentBattles[battleID].players[i] + ' did not bring a ' + Tours.monothreatType + ' team.');
					to_dq[i] = true;
                }
			} else if (Tours.isLTM) {
				var success = false;
				for (var j = 0; j < this_types.length; j++) {
					if (this_types[j].indexOf(LTMtypes) !== -1) {
						success = true;
						break;
					}
				}
				if (!success) {
					problems.push(this.currentBattles[battleID].players[i] + ' did not bring a LTM team.');
					to_dq[i] = true;
				}
			}
		}
		
		//insert checkOMbanlist fn and usage here
		
		if (to_dq[0] || to_dq[1]) {
			if (problems.length === 1) {
				send(battleID + '|Invalid team detected: ' + problems[0])
			} else if (!problems.length) {
				error(battleID + ': Need to dq, but no reason found.');
				send(battleID + '|/savereplay');
				return;
			} else {
				send(battleID + '|Invalid team(s) detected:');
				for (var i = 0; i < problems.length; i++) {
					send(battleID + '|' + problems[i]);
				}
			}
			send(battleID + '|This message was automatically generated. You will be disqualified momentarily.');
			send(battleID + '|To avoid being dq\'d in future tours, please read the announcements before the tour.');
			
			if (to_dq[0]) send('monotype|/tour dq ' + this.currentBattles[battleID].players[0]);
			if (to_dq[1]) send('monotype|/tour dq ' + this.currentBattles[battleID].players[1]);
		}
	},
	onBattleEnd: function(battleID) {
        try {
            this.currentBattles[battleID].leave();
        } catch (e) {
            error('Failed to process onBattleEnd for battle ' + battleID);
        }
	},
	leaveBattle: function(battleID) {
        try {
            this.currentBattles[battleID].leave();
        } catch (e) {
            try {
                send(battleID + '|/part');
                delete this.currentBattles[battleID];
            } catch (e) {
                error('Failed to process leaveBattle for battle ' + battleID);
            }
        }
	},
	onTourEnd: function() {
		for (var i in this.currentBattles) {
			if (this.currentBattles[i].watching) this.currentBattles[i].leave();
		}
	}
};
