exports.teamValidator = {
    staffToPM: ['deathonwings', 'bondie', 'misakamikoto', 'childofdisorder'],
    currentMeta: '',
    battleIds :[],
    currentBattles:{},

    addToIgnoreList: function(staffMember) {
	    if(this.staffToPM.indexOf(staffMember) > -1) {
	        send('monotype|/pm '+staffMember+', you will not be notified of illegal teams by pm anymore.')
	    } else {
	        this.staffToPM.push(staffMember);
	        send('monotype|/pm '+staffMember+', you will not be notified of illegal teams by pm anymore.')
	    }
	},
	removeFromIgnoreList: function(staffMember) {
	    var index = this.staffToPM.indexOf(staffMember);
	    if(index > -1) this.staffToPM.splice(index, 1);
	    send('monotype|/pm '+staffMember+', you will be notified of illegal teams by pm.')
	},
    createBattle: function (player1, player2, battleId) {
        if(battleId.indexOf('monotype') > -1 && !(TeamValidator.currentMeta in {'uu':1,'gen7preview':1} || Tours.isMonothreat || Tours.isLTM || TeamValidator.curr)) return console.log('not checking  teams in: ' + battleId + ' (standard mono)'); //also catches monorandbat
        this.battleIds.push(battleId);
        this.currentBattles[battleId] = {
            p1: player1,
            p2: player2,
            teams: [[],[]],
            types: [],
            hasTeamPreview: false,
            megaEvos: ['', ''],
            isLoggable: true,  // illegal teams change this to false, used to track mono UU usage stats //DoWnote: unused
            numTurns: 0, //DoWnote: unused
        };
        send('|/join ' + battleId);
    },
    addPokemon: function (battleId, playerNum, pokemon) {
        if(!this.currentBattles[battleId]) return console.log(battleId + ': battle does not exist');
        
        if(playerNum==='p1') this.currentBattles[battleId]['teams'][0].push(pokemon);
        if(playerNum==='p2') this.currentBattles[battleId]['teams'][1].push(pokemon);
    },
    onBattleStart: function(battleId){
        if(!this.currentBattles[battleId]) return console.log(battleId + ' battle does not exist');
        if(!this.currentBattles[battleId]['hasTeamPreview']) {
            console.log(battleId + ': battle does not have team preview');
            send('|/leave ' + battleId);
            return;
        }
        if(battleId.indexOf('challengecup1v1') > -1) return;
        //if(battleId.indexOf('gen7') > -1) return;
        
        if (!this.currentMeta) return;
        
        var types = this.checkForMonotype(battleId); //returns an array w/ team type for p1 and p2, empty string for non-mono e.g. ['Steel', '']
        
        var illegalMons = this.checkOMbanlist(battleId, types);
        
        var playersToDQ = ['',''];
        
        if (Tours.isLTM) {
            var ltmTypes = ['fire', 'fairy', 'rock', 'ice', 'electric', 'grass', 'poison', 'ghost'];
            var lowerTierMonoCheck = [ltmTypes.indexOf(toId(types[0])), ltmTypes.indexOf(toId(types[1]))]; //returns an array with two numbers. A -1 indicates an illegal type.
        }
        
        if(/*types.indexOf('') > -1 || */illegalMons[0].length > 0 || illegalMons[1].length > 0 || Tours.isLTM && lowerTierMonoCheck.indexOf(-1) > -1  || (Tours.isMonothreat && (toId(types[0]) !== Tours.monothreatType || toId(types[1]) !== Tours.monothreatType))) {
            //checks for /*non-mono*/, illegal mons, illegal monothreat teams, and illegal LTM teams
            
            var whatsWrong = '';
            
            //handle non-mono teams
            /* removed due to alola formes mucking stuff up, and the fact that the same-type clause is added to everything making this unnecessary
            if (types[0] === '') {
                whatsWrong += this.currentBattles[battleId]['p1'] + ' has a non-Monotype Team, ';
                playersToDQ[0] = this.currentBattles[battleId]['p1'];
            }
            if (types[1] === '') {
                whatsWrong += this.currentBattles[battleId]['p2'] + ' has a non-Monotype Team ';
                playersToDQ[1] = this.currentBattles[battleId]['p2'];
            }
            */
            //this is probably now highly inefficient, as most tour validation was purely to make sure it's monotype, which is no longer needed. I'll take a look at it later.
            
            //handle monothreat tours
            if (Tours.isMonothreat && toId(types[0]) !== Tours.monothreatType) {
                whatsWrong += this.currentBattles[battleId]['p1'] + ' did not bring a ' + Tours.monothreatType + ' team. ';
                 playersToDQ[0] = this.currentBattles[battleId]['p1'];
            }
            if (Tours.isMonothreat && toId(types[1]) !== Tours.monothreatType) {
                whatsWrong += this.currentBattles[battleId]['p2'] + ' did not bring a ' + Tours.monothreatType + ' team. ';
                playersToDQ[1] = this.currentBattles[battleId]['p2'];
            }
            
            //handle Lower-Tier Mono (only allows a sub-set of the 18 types)
            if (Tours.isLTM && lowerTierMonoCheck[0] === -1) {
                whatsWrong += this.currentBattles[battleId]['p1'] + ' brought a(n) ' + toId(types[0]) + ' team, which is illegal in Lower Tier Monotype.';
                 playersToDQ[0] = this.currentBattles[battleId]['p1'];
            }
            if (Tours.isLTM && lowerTierMonoCheck[1] === -1) {
                whatsWrong += this.currentBattles[battleId]['p2'] + ' brought a(n) ' + toId(types[1]) + ' team, which is illegal in Lower Tier Monotype.';
                playersToDQ[1] = this.currentBattles[battleId]['p2'];
            }
            
            //handle illegal pokemon
            for (var player = 0; player <= 1; player++) {
                //console.log(illegalMons);
                if (illegalMons[player].length > 0) {
                    if (player === 0) {
                        whatsWrong += this.currentBattles[battleId]['p1'];
                        playersToDQ[0] = this.currentBattles[battleId]['p1'];
                    }
                    if (player === 1) {
                        whatsWrong += this.currentBattles[battleId]['p2'];
                        playersToDQ[1] = this.currentBattles[battleId]['p2'];
                    }
                    
                    whatsWrong += ' has illegal Pokemon for Monotype ' + this.currentMeta + ' (';
                    
                    for (var foo = 0; foo < illegalMons[player].length; foo++) {
                        var template = this.getTemplate(illegalMons[player][foo]);
                        whatsWrong += template['species'];
                        if(foo !== illegalMons[player].length - 1) whatsWrong += ', ';
                    }
                    
                    whatsWrong += '). ';
                }
            }
            
            console.log(whatsWrong);
            send('monotype|/pm deathonwings, ' + whatsWrong + ' play.pokemonshowdown.com/' + battleId);
            
            send(battleId + '|Invalid team(s) detected: ' + whatsWrong);
            send(battleId + '|This message was automatically generated. You will be disqualified momentarily.');
            send(battleId + '|To avoid being dq\'d in future tours, please read the announcements before the tour.');
            
            for (var i = 0; i <= 1; i++) {
                if (playersToDQ[i] && Tours.autodq){
                    send('monotype|/tour dq ' + playersToDQ[i]);
                }
            }
            if(!Tours.autodq) {
                send('monotype|/modnote invalid monotype team in /join ' + battleId);
                for (var staffMember in this.staffToPM) {
                    send('monotype|/pm ' + this.staffToPM[staffMember] + ', Moderation required in play.pokemonshowdown.com/' + battleId);
                }
		    }
        }
        
    },
    onBattleEnd: function(battleId) {
        // if(TeamValidator.currentMeta === 'uu' && this.currentBattles[battleId]['isLoggable']) {
        //     MonoUU.battles.push(this.currentBattles[battleId])
        // }
        send('|/leave ' + battleId);
    },
    leaveBattle: function(battleId) {
        send('|/leave ' + battleId);
    },
    onTourEnd: function (){
        // if(TeamValidator.currentMeta === 'uu' && this.currentBattles[battleId]['isLoggable']) {
        //     MonoUU.saveBattlesToDisk();
        // }
        
        for(var i=0; i < this.battleIds.length; i++){
            send('|/leave ' + this.battleIds[i]);
        }
        this.currentBattles = {};
        this.battleIds = [];
        console.log('TeamValidator.onTourEnd');
        console.log('TeamValidator.currentMeta: ' + TeamValidator.currentMeta);
    },
    checkForMonotype: function(battleId){
        if(!this.currentBattles[battleId]) return;
        
        var isMono = ['', ''];
        for (var player = 0; player <= 1; player++){
            var monsOnTeam = this.currentBattles[battleId]['teams'][player];
            
            //check for and ignore arceus
            var foo = monsOnTeam.indexOf('arceus');
            if (foo > -1 ) monsOnTeam.splice(foo, 1);
            
            //check for and ignore arceus
            foo = monsOnTeam.indexOf('silvally');
            if (foo > -1 ) monsOnTeam.splice(foo, 1);
            
            var types = [];
            for (var j = 0; j < monsOnTeam.length; j++) {
                
                var template = this.getTemplate(monsOnTeam[j]);
                if (battleId.indexOf('gen5ou') > -1 && monsOnTeam.indexOf('togekiss') > -1){ //horrible, for a few reasons including azu and the fact it's hard to add new exceptions via this
                    types.push(["Flying", "Normal"]);
                } else {
                    types.push(Pokedex[template["speciesid"]]["types"]);
                }
            }
            
            var typeTable = types[0];
            for(var i = 0; i < types.length; i++){
                typeTable = typeTable.filter(function(n) {
                    return types[i].indexOf(n) != -1;
            	});
            }
            
            if (typeTable.length >= 1){
                isMono[player] = toId(typeTable[0]);
                //console.log(typeTable[0]);
            } 
        }   
        console.log(this.currentBattles[battleId]['p1'] + ',  ' + this.currentBattles[battleId]['p2']);
        console.log(isMono);
        this.currentBattles[battleId]['types'] = isMono;
        return isMono;
    },
    checkOMbanlist: function(battleId, types){
        if(!this.currentBattles[battleId]) return;
       
        var illegalMons = [[],[]];
        if(!Metagames[TeamValidator.currentMeta] || !Metagames[TeamValidator.currentMeta]['banlist']) return illegalMons;
        
        for (var player = 0; player <= 1; player++) {
            if (types[player] === '') return illegalMons;
            
            var monsOnTeam = this.currentBattles[battleId]['teams'][player];
            //if (types[player].length > 1) types[player] = [types[player][0]]; //if they have more than 1 type, it causes problems below.
            
            for (var mon = 0; mon < monsOnTeam.length; mon++) {
                // return if meta doesn't have a banlist, or is undefined
                if (!(Metagames[TeamValidator.currentMeta]['banlist']) || !(Metagames[TeamValidator.currentMeta]['banlist']['global'])) return illegalMons;
                
                //check for globally banned 'mons
                if (Metagames[TeamValidator.currentMeta]['banlist']['global'].indexOf(monsOnTeam[mon]) > -1) illegalMons[player].push(monsOnTeam[mon]);
                
                //check for type-banned 'mons
                if (Metagames[TeamValidator.currentMeta]['banlist'][types[player]]){
                    if( Metagames[TeamValidator.currentMeta]['banlist'][types[player]].indexOf(monsOnTeam[mon]) > -1) illegalMons[player].push(monsOnTeam[mon]);
                }
            }
        }
        console.log(illegalMons);
        return illegalMons;
    },
    checkMegaEvo: function(battleId, playerString, megaStone) {
        if(!this.currentBattles[battleId]) return;
        
        var illegalMons = [[],[]];
        if(!Metagames[TeamValidator.currentMeta] || !Metagames[TeamValidator.currentMeta]['banlist']) return illegalMons;
        
        var player;
        if (playerString === 'p1') player = 0;
        if (playerString === 'p2') player = 1;
        
        var types = this.currentBattles[battleId]['types'];
            
        if (!(Metagames[TeamValidator.currentMeta]['banlist']['global'])) return illegalMons;
            
            
        if (Metagames[TeamValidator.currentMeta]['banlist']['global'].indexOf(megaStone) > -1 || (Metagames[TeamValidator.currentMeta]['banlist'][types[player]] && Metagames[TeamValidator.currentMeta]['banlist'][types[player]].indexOf(megaStone) > -1)) {
            //log the illegal mon in the battle chat
            send(battleId + '|Invalid team(s) detected: ' + this.currentBattles[battleId][playerString] + ' is using an illegal mega evolution (' + megaStone + ').');
            console.log(this.currentBattles[battleId][playerString] + ' is using an illegal mega evolution (' + megaStone + ').');
            send(battleId + '|This message was automatically generated. You will be disqualified momentarily.');
            send(battleId + '|To avoid being dq\'d in future tours, please read the announcements before the tour.');
            
            send('monotype|/pm deathonwings, ' + TeamValidator.currentBattles[battleId][playerString] + ' is using an illegal mega evolution (' + megaStone + '). play.pokemonshowdown.com/' + battleId);
		    
		    if (Tours.autodq) {
		        send('monotype|/tour dq ' + TeamValidator.currentBattles[battleId][playerString]);
		    } else {
		        send('monotype|/modnote invalid monotype team in /join ' + battleId);
                for (var staffMember in this.staffToPM) {
                    send('monotype|/pm ' + this.staffToPM[staffMember] + ', Moderation required in play.pokemonshowdown.com/' + battleId);
                }
		    }
        } 
    },
    getTemplate: function (template) {
		if (!template || typeof template === 'string') {
			var name = (template || '').trim();
			var id = toId(name);
			if (Aliases[id]) {
				name = Aliases[id];
				id = toId(name);
			}
			if (!Pokedex[id]) {
				if (id.startsWith('mega') && Pokedex[id.slice(4) + 'mega']) {
					id = id.slice(4) + 'mega';
				} else if (id.startsWith('m') && Pokedex[id.slice(1) + 'mega']) {
					id = id.slice(1) + 'mega';
				} else if (id.startsWith('primal') && Pokedex[id.slice(6) + 'primal']) {
					id = id.slice(6) + 'primal';
				} else if (id.startsWith('p') && Pokedex[id.slice(1) + 'primal']) {
					id = id.slice(1) + 'primal';
				}
			}
			template = {};
			if (id && Pokedex[id]) {
				template = Pokedex[id];
				if (template.cached) return template;
				template.cached = true;
				template.exists = true;
			}
			name = template.species || template.name || name;
// 			if (this.data.FormatsData[id]) {
// 				Object.assign(template, this.data.FormatsData[id]);
// 			}
// 			if (this.data.Learnsets[id]) {
// 				Object.assign(template, this.data.Learnsets[id]);
// 			}
			if (!template.id) template.id = id;
			if (!template.name) template.name = name;
			if (!template.speciesid) template.speciesid = id;
			if (!template.species) template.species = name;
			if (!template.baseSpecies) template.baseSpecies = name;
			if (!template.forme) template.forme = '';
			if (!template.formeLetter) template.formeLetter = '';
			if (!template.spriteid) template.spriteid = toId(template.baseSpecies) + (template.baseSpecies !== name ? '-' + toId(template.forme) : '');
			if (!template.prevo) template.prevo = '';
			if (!template.evos) template.evos = [];
			if (!template.nfe) template.nfe = !!template.evos.length;
			if (!template.gender) template.gender = '';
			if (!template.genderRatio && template.gender === 'M') template.genderRatio = {M:1, F:0};
			if (!template.genderRatio && template.gender === 'F') template.genderRatio = {M:0, F:1};
			if (!template.genderRatio && template.gender === 'N') template.genderRatio = {M:0, F:0};
			if (!template.genderRatio) template.genderRatio = {M:0.5, F:0.5};
// 			if (!template.tier && template.baseSpecies !== template.species) template.tier = this.data.FormatsData[toId(template.baseSpecies)].tier;
			if (!template.tier) template.tier = 'Illegal';
			if (!template.gen) {
				if (template.forme && template.forme in {'Mega':1, 'Mega-X':1, 'Mega-Y':1}) {
					template.gen = 6;
					template.isMega = true;
					template.battleOnly = true;
				} else if (template.forme === 'Primal') {
					template.gen = 6;
					template.isPrimal = true;
					template.battleOnly = true;
				} else if (template.num >= 650) {
					template.gen = 6;
				} else if (template.num >= 494) {
					template.gen = 5;
				} else if (template.num >= 387) {
					template.gen = 4;
				} else if (template.num >= 252) {
					template.gen = 3;
				} else if (template.num >= 152) {
					template.gen = 2;
				} else if (template.num >= 1) {
					template.gen = 1;
				} else {
					template.gen = 0;
				}
			}
		}
		return template;
	},
};