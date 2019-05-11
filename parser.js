/**
 * This is the file where commands get parsed
 *
 * Some parts of this code are taken from the Pokémon Showdown server code, so
 * credits also go to Guangcong Luo and other Pokémon Showdown contributors.
 * https://github.com/Zarel/Pokemon-Showdown
 *
 * @license MIT license
 */

var sys = require('sys');
var https = require('https');
var url = require('url');

exports.parse = {
	actionUrl: url.parse('https://play.pokemonshowdown.com/~~' + config.serverid + '/action.php'),
	room: 'lobby',
	ranks: {},
	data: function(data) {
		if (data.substr(0, 1) === 'a') {
			data = JSON.parse(data.substr(1));
			//console.log(data);
			if (data instanceof Array) {
				for (var i = 0, len = data.length; i < len; i++) {
					this.splitMessage(data[i]);
				}
			} else {
				this.splitMessage(data);
			}
		}
	},
	splitMessage: function(message) {
		if (!message) return;

		var room = 'lobby';
		if (message.indexOf('\n') < 0) return this.message(message, room);

		var spl = message.split('\n');
		
		if (spl[0].charAt(0) === '>') {
			room = spl.shift().substr(1);
			if (spl[0].substr(1, 4) === 'init') {
				var users = spl[2].substr(7).split(',');
				var nickId = toId(config.nick);
				for (var i = users.length; i--;) {
					if (toId(users[i]) === nickId) this.ranks[room] = users[i].trim().charAt(0);
					break;
				}
				ok('joined ' + room);
				if (room === 'monotype') return;
				if (room === 'groupchat-deathonwings-bot' || room === 'groupchat-deathonwings-test') return;
			}
			
		}
		
		for (var i = 0, len = spl.length; i < len; i++) {
			this.message(spl[i], room);
		}
	},
	message: function(message, room) {
		var spl = message.split('|');
		//console.log(spl);
		switch (spl[1]) {
			case 'challstr':
				info('received challstr, logging in...');
				var id = spl[2];
				var str = spl[3];

				var requestOptions = {
					hostname: this.actionUrl.hostname,
					port: this.actionUrl.port,
					path: this.actionUrl.pathname,
					agent: false
				};

				if (!config.pass) {
					requestOptions.method = 'GET';
					requestOptions.path += '?act=getassertion&userid=' + toId(config.nick) + '&challengekeyid=' + id + '&challenge=' + str;
				} else {
					requestOptions.method = 'POST';
					var data = 'act=login&name=' + config.nick + '&pass=' + config.pass + '&challengekeyid=' + id + '&challenge=' + str;
					requestOptions.headers = {
						'Content-Type': 'application/x-www-form-urlencoded',
						'Content-Length': data.length
					};
				}

				var req = https.request(requestOptions, function(res) {
					res.setEncoding('utf8');
					var data = '';
					res.on('data', function(chunk) {
						data += chunk;
					});
					res.on('end', function() {
						if (data === ';') {
							error('failed to log in; nick is registered - invalid or no password given');
							process.exit(-1);
						}
						if (data.length < 50) {
							error('failed to log in: ' + data);
							process.exit(-1);
						}

						if (data.indexOf('heavy load') !== -1) {
							error('the login server is under heavy load; trying again in one minute');
							setTimeout(function() {
								this.message(message);
							}.bind(this), 60 * 1000);
							return;
						}

						if (data.substr(0, 16) === '<!DOCTYPE html>') {
							error('Connection error 522; trying agian in one minute');
							setTimeout(function() {
								this.message(message);
							}.bind(this), 60 * 1000);
							return;
						}

						try {
							data = JSON.parse(data.substr(1));
							if (data.actionsuccess) {
								data = data.assertion;
							} else {
								error('could not log in; action was not successful: ' + JSON.stringify(data));
								process.exit(-1);
							}
						} catch (e) {}
						send('|/trn ' + config.nick + ',0,' + data);
					}.bind(this));
				}.bind(this));

				req.on('error', function(err) {
					error('login error: ' + sys.inspect(err));
				});

				if (data) req.write(data);
				req.end();
				break;
			case 'updateuser':
				if (spl[2] !== config.nick) return;

				if (spl[3] !== '1') {
					error('failed to log in, still guest');
					process.exit(-1);
				}

				ok('logged in as ' + spl[2]);

				// Now join the rooms
				for (var i = 0, len = config.rooms.length; i < len; i++) {
					var room = toId(config.rooms[i]);
					if (room === 'lobby' && config.serverid === 'showdown') continue;
					send('|/join ' + room);
				}
				for (var i = 0, len = config.privaterooms.length; i < len; i++) {
					var room = toId(config.privaterooms[i]);
					if (room === 'lobby' && config.serverid === 'showdown') continue;
					send('|/join ' + room);
				}

				send('|/avatar 120');
				
				BLT.initiate(); 
				HTML.initializeCC();
				HTML.initializeTBC();
				break;
            case 'expire':
                //groupchat expired
                //17:41:32.716 << >groupchat-dowbotjs-aether
                //|expire|
                break;
			case 'c:':
			case 'c':
				var by = spl[3];
				//FindUser.updateUserList(by, spl[1]);
				spl = spl.slice(4).join('|');
				this.chatMessage(spl, by, room);
				break;
			case 'pm':
				var by = spl[2];
				if(!(spl[4].substr(0,1) === config.commandcharacter) && !(toId(by) === toId(config.nick))) send("|/pm " + by + ", " + "DoWbot.js is a bot made for the monotype room by Death on Wings. Commands: https://pastebin.com/BxPgGuhh");
				var now = new Date();
				console.log(by + "(" + now.toTimeString() +  "): " + spl[4]);
				this.chatMessage(spl.slice(4).join('|'), by, ',' + by);
				break;
			case 'l': case 'L':
				var by = spl[2];
				//seen.updateUserList(by, spl[1]);
				break;
			case 'raw':
				//note there is another raw case down below in the battle chat cases which should be deleted and merged with this if it is ever needed
				var text = spl[2];
				//case for /tour getusers command. Used to check for scouters in tournaments.
				//if(text.indexOf('users remain in this tournament') > -1) scout.parseGetUsers(text);
				break;
			case 'tournament':
				var buf = '';
				for (i=2; i<spl.length; i++) {
					buf += spl[i]+'|';
				}
				switch (spl[2]) {
					case 'create':
						// |tournament|create|monotype|Single Elimination|0
						if (spl[3] === 'monotype') Tours.tourRunning = true;
						if (!Tours.TLMcreated) Tours.format = spl[3]; //TODO: check this
						break;
					case 'join':
						break;
					case 'leave':
						break;
					case 'start':
						Tours.onStart(room);
						//scout.updatePlayersInTour();
						break;
					case 'battlestart':
						//|Zheng6640|Hindrest|battle-monotype-265379343
						if (!Tours.tourRunning && (Date.now()/1000 - connect_time) < 3600) {
							error(toId(spl[5]) + ': Tour game started when no tour running.');
							break;
						}
						if (!(Tours.isMonothreat || Tours.isLTM || Tours.currentMeta === 'uu'))
                            break; //TODO: remove Tours.isLTM stuff
						TeamValidator.createBattle(toId(spl[3]), toId(spl[4]), spl[5]);
						break;
					case 'battleend':
						//|tournament|battleend|mega pik☆chu|dfmdmddmmddm|win|2,0
						break;
					case 'disqualify':
						break;
					case 'update':
						var tourProgress = JSON.parse(spl[3]);
						Tours.onUpdate(tourProgress, room); //check for finals to start
						break;
					case 'updateEnd': 
						break;
					case 'forceend':
						console.log('******************\n******************\nTour Force Ended\n******************\n******************');
						Tours.onForceEnd()
						break;
					case 'end':
						Tours.onEnd(spl[3], room);
						if (MMC.isOfficial) MMC.onEnd(spl[3], room);
						if (OMMMC.isOfficial) OMMMC.onEnd(spl[3], room);
						if (BLT.isOfficial) BLT.onEnd(spl[3], room);
						break;
				}
				break;
			/********************
			 * Battle Chat Cases*
			 * ******************/
			 // "room" is the battleId
			case 'init':
				// spl[2] is 'battle'
				break;
			case 'title':
				// spl[2] is 'name1 vs. name2' (no toId applied)
				break;
			case 'join':
				// spl[2] is name of person that joined (no toId applied)
				//scout.isScouting(room, toId(spl[2]));
				break;
			case 'player':
				// spl[2] is p1 or p2
				// spl[3] is name of player (no toId applied)
				// spl[4] is avatar number
				break;
			case 'gametype':
				// spl[2] is 'singles'
				break;
			case 'gen':
				// spl[2] is a number (6 for ORAS)
				break;
			case 'tier':
				// spl[2] is 'Monotype'
				break;
			case 'rated':
				// no spl[2]
				break;
			case 'rule':
				// spl[2] is a description of the rule
				break;
			case 'clearpoke':
				// no spl[2]
				break;
			case 'poke':
				// spl[2] is p1 or p2
				// spl[3] is csv string with species (first letter caps), shiny, gender, etc.
				TeamValidator.addPokemon(room, spl[2], toId(spl[3].split(', ')[0]));
				break;
			case 'teampreview':
				// no spl[2]
				//this will always come after the rated tag, so use it to check for unrated battles (and leave them)
				if(TeamValidator.currentBattles[room]) TeamValidator.currentBattles[room]['hasTeamPreview'] = true;
				break;
			case 'inactive':
				// spl[2] is text about battle timer e.g. name has xx seconds left
				break;
			case 'turn':
				// spl[2] is the turn number
				//console.log(room + ', in parser turn ' + spl[2])
				if (spl[2] === '1') TeamValidator.onBattleStart(room);
				//if(TeamValidator.currentBattles[room]) TeamValidator.currentBattles[room]['numTurns'] = parseInt(spl[2]); //don't think this is used anywhere
				break;
			case '-mega':
				//|-mega|p2a: Pidgeot|Pidgeot|Pidgeotite
				//|-mega|p1a: DEG?|Sharpedo|Sharpedonite
				//spl[2] = p1a: nick
				//spl[3] = species
				//spl[4] = mega stone
				/*var player = spl[2].substr(0,2);
				console.log(spl[2] + ', ' + spl[3] + ', ' + spl[4]);
				TeamValidator.checkMegaEvo(room, player, toId(spl[4]));*/
				break;
			case '-message':
				//check for forfeits
				break;
			case 'win':
				// spl[2] is name of winner
				TeamValidator.onBattleEnd(room);
				//TeamValidator.leaveBattle(room); 
				break;
			case 'raw':
				// spl[2] is the html to be displayed in the battle chat.
				// this section contains the player's rating
				// example: Exots's rating: 1169 &rarr; <strong>1133</strong><br />(-36 for losing)
				
				//note there is another raw case above which should be used over this if it is ever needed
				break;
			case 'c':
				// change this case up above and add an if statement for monotype battles
				break;
			case 'leave':
				// spl[2] is player that left
				break;
			default:
				break;
		}
	},
	chatMessage: function(message, by, room) {
		var cmdrMessage = '["' + room + '|' + by + '|' + message + '"]';
		message = message.trim();
		// auto accept invitations to rooms
		if (room.charAt(0) === ',' && message.substr(0,8) === '/invite ' && this.hasRank(by, '%@&~') && !(config.serverid === 'showdown' && toId(message.substr(8)) === 'lobby')) {
			this.say('', '/join ' + message.substr(8));
            return;
		}
		if (message.substr(0, config.commandcharacter.length) !== config.commandcharacter || toId(by) === toId(config.nick)) return;

		message = message.substr(config.commandcharacter.length);
		var index = message.indexOf(' ');
		var arg = '';
		if (index > -1) {
			var cmd = message.substr(0, index);
			arg = message.substr(index + 1).trim();
		} else {
			var cmd = message;
		}
		cmd = cmd.toLowerCase()
		if (Commands[cmd]) {
			var failsafe = 0;
			while (typeof Commands[cmd] !== "function" && failsafe++ < 10) {
				cmd = Commands[cmd];
			}
			if (typeof Commands[cmd] === "function") {
				cmdr(cmdrMessage);
				Commands[cmd].call(this, arg, by, room);
			} else {
				error("invalid command type for " + cmd + ": " + (typeof Commands[cmd]));
			}
		}
	},
	say: function(room, text) {
		if (room.charAt(0) !== ',') {
			var str = (room !== 'lobby' ? room : '') + '|' + text;
		} else {
			room = room.substr(1);
			var str = '|/pm ' + room + ', ' + text;
		}
		send(str);
	},
	hasRank: function(user, rank) {
		var hasRank = (rank.split('').indexOf(user.charAt(0)) !== -1) || (config.excepts.indexOf(toId(user)) !== -1);
		return hasRank;
	},
	canUse: function(cmd, room, user) {
		var canUse = false;
		var ranks = ' +%@&#~';
		if (!this.settings[cmd] || !this.settings[cmd][room]) {
			canUse = this.hasRank(user, ranks.substr(ranks.indexOf((cmd === 'autoban' || cmd === 'banword') ? '#' : config.defaultrank)));
		} else if (this.settings[cmd][room] === true) {
			canUse = true;
		} else if (ranks.indexOf(this.settings[cmd][room]) > -1) {
			canUse = this.hasRank(user, ranks.substr(ranks.indexOf(this.settings[cmd][room])));
		}
		return canUse;
	},
	

	uncacheTree: function(root) { //used in reload command
		var uncache = [require.resolve(root)];
		do {
			var newuncache = [];
			for (var i = 0; i < uncache.length; ++i) {
				if (require.cache[uncache[i]]) {
					newuncache.push.apply(newuncache,
						require.cache[uncache[i]].children.map(function(module) {
							return module.filename;
						})
					);
					delete require.cache[uncache[i]];
				}
			}
			uncache = newuncache;
		} while (uncache.length > 0);
	},
};
