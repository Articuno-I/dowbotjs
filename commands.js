/**
 * This is the file where the bot commands are located
 *
 * @license MIT license
 */
var http = require('http');
var sys = require('sys');
var modchat_level = 'off';
var aether_ranks = require('./aether_ranks.js').ranks;

var repeating = false;
function repeat_message(message, room, time, repeat_count) {
    if (repeating && --repeat_count) {
        send(room + '|``Automated repeating message: ``' + message);
        setTimeout(repeat_message(message, room, time, repeat_count), time * 1000);
    }
}

function rewriteranks() {
    var outp = "exports.ranks = {\n";
    for (var i in aether_ranks) {
        outp += "    '" + i + "': " + aether_ranks[i] + "',\n";
    }
    outp += '};';
    var fs = require('fs');
    fs.writeFileSync('./aether_ranks.js', outp);
}

if (config.serverid === 'showdown') {
    var https = require('https');
    var csv = require('csv-parse');
}
const whitelist = ['scpinion', 'bondie', 'acast']; //idk what this even does ngl

exports.commands = {

    /*******************************/
    /* Helpful commands I added in */
    /*******************************/

    help: function(arg, by, room) { //apparently required for bots now
        var text = '';
        if (!(this.hasRank(by, '%@#&~') || by.charAt(0) === ','))
            text = '/pm ' + toId(by) + ', ';
        text += "DoWbot.js is a bot made for the monotype room by Death on Wings. Commands: https://pastebin.com/BxPgGuhh";
        this.say(room, text);
    },
    custom: function(arg, by, room) { //(original boTTT code which scp took out, idk why)
        if (toId(by) === 'dow') {
            if (arg.indexOf('[') !== 0) {
                this.say(room, arg);
                return;
            }
            var tarRoom = arg.slice(1, arg.indexOf(']'));
            this.say(tarRoom, arg.substr(arg.indexOf(']') + 1).trim());
        }
    },
    yrj77sports: function(arg, by, room) {
        //requested by bondie. When I asked what it should be called, he said "surprise me".
        if (['torkool', 'acast', 'eien', 'dow'].indexOf(toId(by)) > -1) {
            this.say(room, '/logout');
            console.log('Logged out by ' + by);
            setTimeout(process.exit, 2000);
        }
    },
    uptime: function(arg, by, room) {
        var text = '';
        if (!(this.hasRank(by, '%@#&~') || by.charAt(0) === ',')) {
            text = '/pm ' + toId(by) + ', ';
        }
        var uptime = Math.floor(Date.now() / 1000) - connect_time;
        var days = Math.floor(uptime / 86400);
        uptime = uptime % 86400;
        var hours = Math.floor(uptime / 3600);
        uptime = uptime % 3600;
        var minutes = Math.floor(uptime / 60);
        uptime = uptime % 60;
        text += 'Uptime: ' + days + ' days, ' + hours + ' hours, ' + minutes + ' minutes and ' + uptime + ' seconds.';
        this.say(room, text);
    },
    js: function(arg, by, room) {
        if (toId(by) !== 'dow') return false;
        try {
            var result = eval(arg.trim());
            send(room + '|' + JSON.stringify(result));
        } catch (e) {
            send(room + '|' + e.name + ": " + e.message);
        }
    },

    /***********************/
    /* Tournament Commands */
    /***********************/

    tour: function(arg, by, room) {
        if (this.hasRank(by, '%@#&~')) {
            this.say(room, '/tour ' + arg);
            setTimeout(this.say(room, '/autodq 6'), 1000);
        } else if (room.charAt(0) === ',') {
            this.say(room, 'why would you pm me that?');
        } else {
            this.say(room, '/pm ' + by + ', only staff can use this command.');
        }
    },
    rt: 'randomType',
    randomType: function(arg, by, room) {
        if (this.hasRank(by, '%@#&~')) {
            var typeList = ["bug", "dark", "dragon", "electric", "fairy", "fighting", "fire", "flying", "ghost", "grass", "ground", "ice", "normal", "poison", "psychic", "rock", "steel", "water"];
            var type = typeList[Math.floor(Math.random() * typeList.length)];
            this.say(room, 'Random Type: ' + type);
        }
    },
    monothreat: function(arg, by, room) {
        //use global scope names instead of "this" because .om is called from .astartOM
        if (this.hasRank(by, '%@#&~')) {
            if (Tours.tourRunning) return this.say(room, 'There is already a tour running!');

            var typeList = ["bug", "dark", "dragon", "electric", "fairy", "fighting", "fire", "flying", "ghost", "grass", "ground", "ice", "normal", "poison", "psychic", "rock", "steel", "water"];
            var type = toId(arg)

            if (typeList.indexOf(type) < 0) {
                send(room + '|unrecognized type.')
                return;
            }

            TeamValidator.currentMeta = 'monothreat';
            Tours.isMonothreat = true;
            Tours.monothreatType = type;
            Tours.pastTours.push("Monothreat (" + type + ")");
            Tours.TLMcreated = true;

            var capFLType = type.charAt(0).toUpperCase() + type.slice(1);
            setTimeout(function() {
                send(room + '|/addhtmlbox <div style="text-align:center;"><div style="font-size: 15px; font-weight: bold;"><a href="http://www.smogon.com/forums/threads/monothreat-resource-guide.3582526/">Monothreat Tournaments</a></div><p>In Monothreat tournaments everyone must bring the same type!</p><p>This is a <img src="http://play.pokemonshowdown.com/sprites/types/' + capFLType + '.png" height=14px width=32px> Monothreat. <span style="color:red;">Make sure you bring a <img src="http://play.pokemonshowdown.com/sprites/types/' + capFLType + '.png" height=14px width=32px> team!</span><p><b>Pro Tip #1:</b> Your opponent will use a ' + capFLType + ' team. Make sure your ' + capFLType + ' team is prepared to deal with it! :)</p></div>');
            }, 1000);

            setTimeout(function() {
                send(room + '|/tour create monotype, elimination');
                send(room + '|/tour setautostart 7');
            }, 2000);

            setTimeout(function() {
                Tours.autodq = true;
                send(room + '|/tour name Monothreat ' + capFLType)
                send(room + '|Players that bring illegal teams will automatically be disqualified from this tour.');
            }, 3000);

            //TODO: use clearTimeout on these if tour starts early
            /*Tours.timers[Tours.timers.length + 1] = setTimeout(function() {
            send(room + '|/addhtmlbox <div style="text-align:center;"><p>This is a <img src="http://play.pokemonshowdown.com/sprites/types/' + capFLType + '.png" height=14px width=32px> <a href="http://www.smogon.com/forums/threads/monothreat-resource-guide.3582526/">Monothreat</a>. <span style="color:red;">Make sure you bring a <img src="http://play.pokemonshowdown.com/sprites/types/' + capFLType + '.png" height=14px width=32px> team!</span><p><b>Pro Tip #1:</b> Your opponent will use a ' + capFLType + ' team. Make sure your ' + capFLType + ' team is prepared to deal with it! :)</p></div>');
            }, 90000);

            Tours.timers[Tours.timers.length + 1] = setTimeout(function() {
            send(room + '|/addhtmlbox <div style="text-align:center;"><p>This is a <img src="http://play.pokemonshowdown.com/sprites/types/' + capFLType + '.png" height=14px width=32px> <a href="http://www.smogon.com/forums/threads/monothreat-resource-guide.3582526/">Monothreat</a>. <span style="color:red;">Make sure you bring a <img src="http://play.pokemonshowdown.com/sprites/types/' + capFLType + '.png" height=14px width=32px> team!</span><p><b>Pro Tip #1:</b> Your opponent will use a ' + capFLType + ' team. Make sure your ' + capFLType + ' team is prepared to deal with it! :)</p><p>The tour will start in ~7 minutes.</p></div>');
            }, 180000);

            Tours.timers[Tours.timers.length + 1] = setTimeout(function() {
            send(room + '|/addhtmlbox <div style="text-align:center;"><p>This is a <img src="http://play.pokemonshowdown.com/sprites/types/' + capFLType + '.png" height=14px width=32px> <a href="http://www.smogon.com/forums/threads/monothreat-resource-guide.3582526/">Monothreat</a>. <span style="color:red;">Make sure you bring a <img src="http://play.pokemonshowdown.com/sprites/types/' + capFLType + '.png" height=14px width=32px> team!</span><p><b>Pro Tip #1:</b> Your opponent will use a ' + capFLType + ' team. Make sure your ' + capFLType + ' team is prepared to deal with it! :)</p></div>');
            }, 270000);

            Tours.timers[Tours.timers.length + 1] = setTimeout(function() {
            send(room + '|/addhtmlbox <div style="text-align:center;"><p>This is a <img src="http://play.pokemonshowdown.com/sprites/types/' + capFLType + '.png" height=14px width=32px> <a href="http://www.smogon.com/forums/threads/monothreat-resource-guide.3582526/">Monothreat</a>. <span style="color:red;">Make sure you bring a <img src="http://play.pokemonshowdown.com/sprites/types/' + capFLType + '.png" height=14px width=32px> team!</span><p><b>Pro Tip #2:</b> Bring a ' + capFLType + ' team or you will be disqualified.</p><p>The tour will start in ~4 minutes.</p></div>');
            }, 360000);

            Tours.timers[Tours.timers.length + 1] = setTimeout(function() {
            send(room + '|/addhtmlbox <div style="text-align:center;"><p>This is a <img src="http://play.pokemonshowdown.com/sprites/types/' + capFLType + '.png" height=14px width=32px> <a href="http://www.smogon.com/forums/threads/monothreat-resource-guide.3582526/">Monothreat</a>. <span style="color:red;">Make sure you bring a <img src="http://play.pokemonshowdown.com/sprites/types/' + capFLType + '.png" height=14px width=32px> team!</span><p><b>Pro Tip #2:</b> Bring a ' + capFLType + ' team or you will be disqualified.</p></div>');
            }, 450000);

            Tours.timers[Tours.timers.length + 1] = setTimeout(function() {
            send(room + '|/addhtmlbox <div style="text-align:center;"><p>This is a <img src="http://play.pokemonshowdown.com/sprites/types/' + capFLType + '.png" height=14px width=32px> <a href="http://www.smogon.com/forums/threads/monothreat-resource-guide.3582526/">Monothreat</a>. <span style="color:red;">Make sure you bring a <img src="http://play.pokemonshowdown.com/sprites/types/' + capFLType + '.png" height=14px width=32px> team!</span><p><b>Pro Tip #2:</b> Bring a ' + capFLType + ' team or you will be disqualified.</p><p>The tour will start in ~1 minutes.</p></div>');
            }, 540000);*/
        } else if (room.charAt(0) === ',') {
            send(room + '|Try starting the tour in the Monotype room, not a pm. :P');
        } else {
            send(room + '|/pm ' + by + ', only staff can use this command');
        }
    },

    randthreat: 'randommonothreat',
    randommonothreat: function(arg, by, room) {
        var typeList = ["bug", "dark", "dragon", "electric", "fairy", "fighting", "fire", "flying", "ghost", "grass", "ground", "ice", "normal", "poison", "psychic", "rock", "steel", "water"];
        return exports.commands.monothreat(typeList[Math.floor(Math.random() * 18)], by, room);
    },

    setot: 'setofficial',
    setofficial: function(arg, by, room) {
        if (this.hasRank(by, '%@#&~')) {

            if (arg === 'true') {
                BLT.isOfficial = true;
                return;
            } else if (arg === 'false') {
                BLT.isOfficial = false;
                return;
            }

            console.log(arg)
            var metaList = Object.keys(BLT.metas[BLT.season]);
            if (metaList.indexOf(toId(arg)) < 0) {
                var text = "Unrecognized meta, please choose from the following list : monotype, ltm, uu.";
            } else {
                BLT.nextMeta = toId(arg);
                var text = "The next official tour will be " + BLT.nextMeta +".";
            }

            if (arg === 'random') {
                BLT.nextMeta = metaList[Math.floor(Math.random() * metaList.length)];

                var text = "The next official tour will be " + BLT.nextMeta +".";
            }
        } else if (room.charAt(0) === ',') {
            var text = 'Try this command in the Monotype room, not a pm. :P';
        } else {
            var text = '/pm ' + by + ', only staff can use this command';
        }
        this.say(room, text);
    },
    startot: 'startofficial', //ik this is deprecated but it's just so useful dammit
    startofficial: function(arg, by, room) {
        if (this.hasRank(by, '%@#&~')) {
            if (Tours.tourRunning) return this.say(room, 'There is already a tour running!');

            var meta = toId(BLT.nextMeta);
            if (meta === '') { //outdated
                this.say(room, 'The bot was restarted since the last tour. Choosing a random meta to play...');
                var metaList = Object.keys(BLT.metas[BLT.season]);
                meta = metaList[Math.floor(Math.random() * metaList.length)];
            }
            // this.say(room, '/addhtmlbox <div style="text-align: center;"><strong>Monotype\'s BLT is in the playoffs!</strong><br/>While playoffs are running, the official tours count towards a room tournament leaderboard. <br/><br/>Play in the tours to see if you can be among the best; the winner will be featured in the room intro!</div>');
            // this.say(room, 'More information: http://www.smogon.com/forums/threads/monotype-blt.3578283/');

            BLT.isOfficial = true; //causes data to be logged and the next meta to be different

            /*if (meta !== 'monotype') {
            exports.commands.om(meta, by, room);
            } else {
            send(room + '|/tour create monotype, elimination');
            send(room + '|/tour setautostart 7');
            send(room + '|/addhtmlbox <p style="text-align:center;">This will be a standard Gen 7 Monotype tournament and will count toward the Monotype Room\'s leaderboard.</p>');
            send(room + '|/modchat off');
            }*/

            setTimeout(function() {
                //tour commands may have been swallowed due to messages being too close otherwise
                send(room + '/wall About BLT: http://www.smogon.com/forums/threads/monotype-blt.3627208/');
                send(room + '/wall Leaderboards: https://docs.google.com/spreadsheets/d/1Nxrqz-2gJd6FTt3xHG_Rax4MhlhftTJ-AxfR38vtXLo/edit#gid=0');

                if (meta === 'monotype') meta = 'gen7';
                console.log('Starting OT. Metagame: ' + meta);
                exports.commands.om(meta, by, room);
            }, 1000);

            var oldMeta = BLT.nextMeta;
            do {
                BLT.nextMeta = BLT.newMetasList[Math.floor(Math.random() * BLT.newMetasList.length)];
            } while (BLT.nextMeta === oldMeta);
            console.log('The next OT will be ' + BLT.nextMeta);

            return;
        } else if (room.charAt(0) === ',') {
            var text = 'Try starting the tour in the Monotype room, not a pm. :P';
        } else {
            var text = '/pm ' + by + ', only staff can use this command';
        }
        this.say(room, text);
    },
    startblt: function(arg, by, room) {
        if (this.hasRank(by, '%@#&~') ) {
            if (Tours.tourRunning) return this.say(room, 'There is already a tour running!');

            this.say(room, 'The room tours for Monotype\'s Best Leaderboard Tour are on hold while the playoffs are running. Room staff, please use the .startofficial command to start the official tour.');
            return;

            var meta = toId(BLT.nextMeta);
            if (meta === '') {
                this.say(room, 'The bot was restarted since the last BLT tour. Choosing a random meta to play...');
                var metaList = Object.keys(BLT.metas[BLT.season]);
                meta = metaList[Math.floor(Math.random() * metaList.length)];
            }
            this.say(room, '/modchat +');
            this.say(room, 'A Monotype Best Leaderboard Tournament event has started!');
            this.say(room, 'More information: http://www.smogon.com/forums/threads/monotype-blt.3578283/');
            var noAutoDqMetas = {'dpp':1};
            if (!(meta in noAutoDqMetas)) {
                Tours.autodq = true;
                this.say(room, 'Players that bring illegal teams will automatically be disqualified from this tour.');
            }

            this.say(room, '/addhtmlbox <div style="color:red; font-weight:bold; text-align:center;">Please check out the <a href="http://www.smogon.com/forums/threads/monotype-blt.3578283/#post-6972239" target="_blank">Monotype BLT thread</a> on Smogon if you placed in the top 8 in a previous week. The playoffs start soon and we are getting the draft organized!</div>');
            BLT.isOfficial = true;

            if (meta !== 'monotype') {
                exports.commands.om(meta, by, room);
            } else {
                send(room + '|/tour create monotype, elimination');
                send(room + '|/tour setautostart 10');
                this.say(room, '/wall This will be a standard ORAS Monotype tournament.');
                this.say(room, '/modchat ' + modchat_level);
            }

            return;
        } else if (room.charAt(0) === ',') {
            var text = 'Try starting the tour in the Monotype room, not a pm. :P';
        } else {
            var text = '/pm ' + by + ', only staff can use this command';
        }
        this.say(room, text);
    },
    setblt: function(arg, by, room) {
        if (this.hasRank(by, '%@#&~')) {

            if (arg === 'true') {
                BLT.isOfficial = true;
                return;
            } else if (arg === 'false') {
                BLT.isOfficial = false;
                return;
            }

            if (arg in {'random':0}) {
                var metaList = Object.keys(BLT.metas[BLT.season]);
                BLT.nextMeta = metaList[Math.floor(Math.random() * metaList.length)];

                var text = "The next tour in the BLT will be " + BLT.nextMeta + "."; //weird, it's almost as tho bondie accidentally edited this line
            } else if (Object.keys(BLT.metas[BLT.season]).indexOf(toId(arg)) < 0) {
                var text = "Unrecognized meta, or this meta is not available for this season. Please choose from the following list: ";
                for (var m in BLT.metas[BLT.season]) {
                    text += m + ', ';
                }
            } else {
                BLT.nextMeta = toId(arg);
                var text = "The next tour in the Monotype BLT will be " + BLT.nextMeta +".";
            }
        } else if (room.charAt(0) === ',') {
            var text = 'Try this command in the Monotype room, not a pm. :P';
        } else {
            var text = '/pm ' + by + ', only staff can use this command';
        }
        this.say(room, text);
    },
    setbltweek: function(arg, by, room) {
        if (this.hasRank(by, '#&~')) {
            BLT.week = parseInt(arg);
            var text = 'Now logging tours for BLT Season ' + BLT.season + ', Week ' + BLT.week;
            var tempBLT = {
            "season": BLT.season,
            "week": BLT.week,
            "metas": BLT.metas,
            "tourLog": BLT.tourLog,
            }
            var fs = require('fs');
            fs.writeFile("BLT.json", JSON.stringify(tempBLT), function(err) {
            if (err) {
                send('monotype' + '|/pm dow, error adding this tour to the log. Please let scp know about this error.')
                return console.log(err);
            }
            BLT.updateSite();
            });
        } else if (room.charAt(0) === ',') {
            var text = 'Try this command in the Monotype room, not a pm. :P';
        } else {
            var text = '/pm ' + by + ', only # and higher can use this command';
        }
        this.say(room, text);
    },
    setbltseason: function(arg, by, room) {
        if (this.hasRank(by, '#&~')) {
            BLT.season = parseInt(arg);
            var text = 'Now logging tours for BLT Season ' + BLT.season + ', Week ' + BLT.week;
            var tempBLT = {
            "season": BLT.season,
            "week": BLT.week,
            "metas": BLT.metas,
            "tourLog": BLT.tourLog,
            }
            var fs = require('fs');
            fs.writeFile("BLT.json", JSON.stringify(tempBLT), function(err) {
            if (err) {
                send('monotype' + '|/pm dow, error adding this tour to the log. Please let scp know about this error.');
                return console.log(err);
            }
            BLT.updateSite();
            });
        } else if (room.charAt(0) === ',') {
            var text = 'Try this command in the Monotype room, not a pm. :P';
        } else {
            var text = '/pm ' + by + ', only # and higher can use this command';
        }
        this.say(room, text);
    },
    om: function(arg, by, room) {
        if (!this.hasRank(by, '%@#&~')) {
            if (room.charAt(0) === ',')
            send(room + '|Try using that in the room rather than PM :P');
            else send(room + '|/w ' + by + ', only staff can use this command.');
        }

        if (Tours.tourRunning) return send(room + '|There is already a tour running!');

        //handle unknown metas
        var supportedMetas = Object.keys(metagames);
        var meta = toId(arg);
        if (supportedMetas.indexOf(meta) < 0) {
            var text = '|Unrecognised meta, please choose from the following list ';
            for (var i in supportedMetas) {
            text += supportedMetas[i];
            if (i < supportedMetas.length - 1) text += ', ';
            }
            send(room + text);
            return;
        }

        Tours.pastTours.push(meta);
        //Tours LTM stuff here is deprecated
        //TODO: remove this stuff somehow
        if (meta === 'ltm') Tours.isLTM = true;
        Tours.LTMcreated = true; //not even sure if this line was ever right lol

        TeamValidator.currentMeta = toId(meta);
        console.log('starting OM tour... TeamValidator.currentMeta: ' + TeamValidator.currentMeta);

        var commands_len = metagames[meta].start.length;

        if (commands_len > 2)
            send(room + '|/modchat +'); //need to work out if I still need this
        //it can be useful, but it can also be distracting.

        //previously the bot would send a message here reminding people that it would be a mono
        //(meta) tour. However, I believe this is generally done in the metagames section now.

        for (var i = 0; i < commands_len; i++) {
            setTimeout(send.bind(null, room + '|' + metagames[meta].start[i]), i * 1000);
        }

        if (commands_len > 2)
            setTimeout(send.bind(null, room + '|/modchat off'), commands_len * 1000);

        //reminder text
        for (var i in metagames[meta]) {
            if (!(+i)) continue;
            setTimeout(function() {
            if (!Tours.tourRunning) {
                for (var j = 0; j < metagames[meta][i].length; j++) {
                send(room + '|' + metagames[meta][i][j]);
                }
            }
            }, +i);
        }
    },
    //old om function: 
/*    om: function(arg, by, room) {
    //use global scope names instead of "this" because .om is called from .startOM
    //dow edit: Is it still? Buggered if I know
    if (this.hasRank(by, '%@#&~')) {

        if (Tours.tourRunning) return this.say(room, 'There is already a tour running!');

        var supportedMetas = Object.keys(Metagames);
        var meta = toId(arg);
        if (supportedMetas.indexOf(meta) < 0) {
        var text = ' |Unrecognized meta, please choose from the following list: ';
        for (m in supportedMetas) {
            text += supportedMetas[m] 
            if (m < supportedMetas.length) text += ", "
        }
        send(room + text);
        return;
        }
        if (!Metagames[meta]["playable"]) {
        send(room + " |This metagame is currently not playable through TLM."); 
        return;
        }

        Tours.pastTours.push(meta)
        if (meta === 'ltm') Tours.isLTM = true;
        Tours.TLMcreated = true;
        TeamValidator.currentMeta = toId(meta);

        console.log('starting OM tour... TeamValidator.currentMeta: ' + TeamValidator.currentMeta);
        send(room + '|/modchat +');

        setTimeout(function() {
         if (meta !== 'ltm') send(room + '|/wall This tour will be a Monotype ' + meta + ' tour. You must bring a Monotype team.');
        }, 1000);

        function doScaledTimeout(i) {
        setTimeout(function() {
            send(room + '|' + Metagames[meta]["preTourText"][i]);
        }, (i * 500) + 2000);
        }

        for (var i = 0; i < Metagames[meta]["preTourText"].length; i++) {
        doScaledTimeout(i);
        }

        setTimeout(function() {
        send(room + '|/tour create '+ Metagames[meta]["tourCommand"] +', elimination'); //is this line needed?
        send(room + '|/tour setautostart 7');
        if (Metagames[meta]["native-banlist"]) {
            send(room + '|/tour banlist ' + Metagames[meta]["native-banlist"]); 
        } else {
            send(room + '|/tour banlist sametypeclause');
        }
        }, Metagames[meta]["preTourText"].length*500 + 3000);

        setTimeout(function() {
        var noAutoDqMetas = {'dpp':1};
        if (!(meta in noAutoDqMetas)) {
            Tours.autodq = true;
            send(room + '|Players that bring illegal teams will automatically be disqualified from this tour.');
        }
        }, Metagames[meta]["preTourText"].length*500 + 4000);


        //Reminder text: Originally this was added to stop people from complaining when we dq'd them for bringing non-mono
        //obviously this is no longer an issue
        //its other purpose is giving info about the meta, but it only does this for a few metas and is hard to update
        //and I'm unconvinced it actually helps any real amount
        //So I've taken it out until someone complains I took it out

        var reminderText = function(meta) { //old comment started here
        switch(meta) {
            case 'uu':
            send(room + '|/wall This is a __Monotype UU__ tour. Note the banlist is based on the Monotype Ladder Stats, not OU. You can view the banlist for this tour here: https://docs.google.com/spreadsheets/d/1EeOb3dxhG1Cqtd5UuGK3HcobQbb8phr45sVXKOGfUMY/pubhtml');
            break;
            case 'bw':
            send(room + '|/wall This is a **Monotype** BW tour. Scroll up to see more info. You must bring a Monotype team. Resources: http://www.smogon.com/forums/threads/bw-monotype-mega-thread.3565162/');
            break;
            case 'ltm':
            send(room + '|/addhtmlbox <div style="text-align:center;"><div style="font-size: 15px; font-weight: bold;"><a href="http://www.smogon.com/forums/threads/3565395/#post-6766630/">Lower Tier Monotype</a></div><p>In Lower Tier Mono, or LTM, only the underused types are allowed. These are:</p><p><img src="http://play.pokemonshowdown.com/sprites/types/Fairy.png" height=14px width=32px>  <img src="http://play.pokemonshowdown.com/sprites/types/Fire.png" height=14px width=32px>  <img src="http://play.pokemonshowdown.com/sprites/types/Electric.png" height=14px width=32px>  <img src="http://play.pokemonshowdown.com/sprites/types/Rock.png" height=14px width=32px>  <img src="http://play.pokemonshowdown.com/sprites/types/Ice.png" height=14px width=32px>  <img src="http://play.pokemonshowdown.com/sprites/types/Grass.png" height=14px width=32px>  <img src="http://play.pokemonshowdown.com/sprites/types/Ghost.png" height=14px width=32px>  <img src="http://play.pokemonshowdown.com/sprites/types/Poison.png" height=14px width=32px></p><p style="color:red;">Make sure you bring one of these types!</p></div>');
            break;
            case 'cap':
            send(room + '|/wall This is a **Monotype** CAP tour. You must bring a Monotype team. Note that the monotype banlist is in effect.');
            break;
            case 'gen7preview':
            send(room + '|This is a Monotype gen7preview tournament. It is used to test out our updated banlist for gen 7, without any gen 7 mechanics!')
            send(room + '|!tour viewbanlist');
            break;
            default:
            send(room + '|/wall This is a **Monotype** ' + meta + ' tour. Scroll up to see more info. You must bring a Monotype team');
            if (Metagames[meta]["preTourText"][1]) send(room + '|' + Metagames[meta]["preTourText"][1]);
            break;
        }
        }; //commented part ended here

        var reminderText = function(meta) {
        if (!Tours.tourRunning) send(room + '|/wall This is a **Monotype** ' + meta + ' tour. Scroll up to see more info. You must have a monotype team.');
        }

        setTimeout(function() {
        send(room + '|/modchat '+modchat_level);
        }, Metagames[meta]["preTourText"].length*500 + 6000);

        Tours.timers[Tours.timers.length + 1] = setTimeout(function() {
        reminderText(meta);
        }, 90000);

        Tours.timers[Tours.timers.length + 1] = setTimeout(function() {
        reminderText(meta);
        if (!Tours.tourRunning) send(room + '|The tour will start in ~4 minutes.');
        }, 180000);

        Tours.timers[Tours.timers.length + 1] = setTimeout(function() {
        reminderText(meta);
        }, 270000);

        Tours.timers[Tours.timers.length + 1] = setTimeout(function() {
        reminderText(meta);
        if (!Tours.tourRunning) send(room + '|The tour will start in ~1 minute.');
        }, 360000);


    } else if (room.charAt(0) === ',') {
        send(room + '|Try starting the tour in the Monotype room, not a pm. :P');
    } else {
        send(room + '|/pm ' + by + ', only staff can use this command');
    }
    },*/
/*    setcheckerom: function(arg, by, room) {
    var supportedMetas = Object.keys(Metagames);
    if (this.hasRank(by, '%@#&~')) {
        if (supportedMetas.indexOf(toId(arg)) < 0 && !(arg === 'monotype')) {
        var text = ' |unrecognized meta, please choose from the following list: ';
        for (var m in supportedMetas) {
            text += supportedMetas[m] 
            if (m < supportedMetas.length) text += ", "
        }
        } else {
        TeamValidator.currentMeta = toId(arg);
        var text = "the banlist for " + arg +" will be checked.";
        console.log('TeamValidator.currentMeta: ' + TeamValidator.currentMeta);
        }
    } else if (room.charAt(0) === ',') {
        var text = 'Try this command in the Monotype room, not a pm. :P';
    } else {
        var text = '/pm ' + by + ', only staff can use this command';
    }
    this.say(room, text);
    },*/

    randomom: function(arg, by, room) {
        var metaList = ['aaa', 'doubles', 'lc', 'stabmons', 'ubers'];
        return exports.commands.om(metaList[Math.floor(Math.random() * 5)], by, room);
    },

    autodq: 'setautodq',
    setautodq: function(arg, by, room) {
    if (this.hasRank(by, '%@#&~')) {
        var text = '';
        /*if (TeamValidator.currentMeta === 'bw') {
        text += 'The autodq feature is not available in BW tours.';
        this.say(room, text);
        return;
        }*/
        if (arg ==='on') {
        Tours.autodq = true;
        text = 'Players that bring illegal teams will automatically be disqualified from this tour.';
        } else if (arg ==='off') {
        Tours.autodq = false;
        text = 'Players that bring illegal teams will not be automatically disqualified from this tour. The room staff will dq people with illegal teams.';
        } else {
        text = 'Please use .autodq on or .autodq off';
        }
    } else if (room.charAt(0) === ',') {
        var text = 'Try this command in the Monotype room, not a pm. :P';
    } else {
        var text = '/pm ' + by + ', only staff can use this command';
    }
    this.say(room, text);
    },

/*    setot: function(arg, by, room) {
    if (this.hasRank(by, '%@#&~')) { //how tf did this command not have that before? Dammit scp
        //DoWedit: lmao what an scp thing to do
        if (arg ==='true') MMC.isOfficial = true;
        if (arg ==='false') MMC.isOfficial = false;
    }
    },

    setom: function(arg, by, room) {
    if (this.hasRank(by, '%@#&~')) {

        if (arg === 'true') {OMMMC.isOfficial = true; return;}
        if (arg === 'false') {OMMMC.isOfficial = false; return;}

        console.log(arg)
        if (OMMMC.metaList.indexOf(toId(arg)) < 0) {
        var text = "Unrecognized meta, please choose from the following list : AAA, UU, LC, Doubles, BW.";
        } else {
        if (arg === 'BH') {
            this.say(room, 'BH is not a part of the OM monthly championship. Please chose from the following list : AAA, UU, LC, Doubles, BW.')
            return;
        }
        OMMMC.nextMeta = toId(arg);
        var text = "The next tour in the OM championship will be " + OMMMC.nextMeta +".";
        }

        if (arg === 'random') {
        OMMMC.nextMeta = OMMMC.metaList[Math.floor(Math.random() * 6)]; //only pick from the first 6 indicies (BH is the 7th entry)

        var text = "The next tour in the OM championship will be " + OMMMC.nextMeta +".";
        }
    } else if (room.charAt(0) === ',') {
        var text = 'Try this command in the Monotype room, not a pm. :P';
    } else {
        var text = '/pm ' + by + ', only staff can use this command';
    }
    this.say(room, text);
    },*/

    logstate: function(arg, by, room) {
    if (room.charAt(0) === ',' && (toId(by) === config.owner || whitelist.indexOf(toId(by)) > -1)) {
        console.log('TeamValidator.currentMeta: ' + TeamValidator.currentMeta)
        console.log('MMC.isOfficial: ' + MMC.isOfficial)
        console.log('OMMMC.isOfficial: ' + OMMMC.isOfficial)
        console.log('OMMMC.nextMeta: ' + OMMMC.nextMeta);
        if (arg === 'all') {
        //console.log('TeamValidator.battleIds: ' + TeamValidator.battleIds);
        //console.log('TeamValidator.currentBattles: ' + TeamValidator.currentBattles);
        console.log('Tours.isMonothreat: ' + Tours.isMonothreat);
        console.log('Tours.monothreatType: ' + Tours.monothreatType);
        console.log('Tours.tourRunning: ' + Tours.tourRunning);
        }

        send('|/pm ' + by + ', TeamValidator.currentMeta: ' + TeamValidator.currentMeta.toString()) 
        send('|/pm ' + by + ', MMC.isOfficial: ' + MMC.isOfficial.toString())
        send('|/pm ' + by + ', OMMMC.isOfficial: ' + OMMMC.isOfficial.toString());
        send('|/pm ' + by + ', Tours.autodq: ' + Tours.autodq.toString());
    }

    },
    ignore: function(arg, by, room) {
    // used to ignore pm's from TLM about room tours
    // idk if this is even relevant any more
    if (room.charAt(0) === ',') {
        if (arg ==='on') TeamValidator.addToIgnoreList(toId(by));
        if (arg ==='off') TeamValidator.removeFromIgnoreList(toId(by));
    }
    },
    nextofficial: 'nextot',
    nexttour: 'nextot',
    nextot: function(arg, by, room) {
    if (room.charAt(0) === ',') {
        var text = '';
    } else if (this.hasRank(by, '+%@#&~')) {
        var text = '/wall ';
    } else {
        this.say(room, "Please use pm's for the nextot command if you're not a voice or higher.");
        //no longer warns bc that seems unnecessary at this point
        return;
    }
    var now = new Date();

    var timeOfNextTour = [];
    if (now.getUTCHours() < 1) {
        timeOfNextTour = [now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 1, 0];
    } else if (now.getUTCHours() < 7) {
        timeOfNextTour = [now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 7, 0];
    } else if (now.getUTCHours() < 13) {
        timeOfNextTour = [now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 13, 0];
    } else if (now.getUTCHours() < 19) {
        timeOfNextTour = [now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 19, 0];
    } else if (now.getUTCHours() >= 19) { //needed if OT times aren't at 6, 12, 18, 24 to cover rollover into next day
        timeOfNextTour = [now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 1, 0];
    }

    var end = new Date(Date.UTC(timeOfNextTour[0],timeOfNextTour[1],timeOfNextTour[2],timeOfNextTour[3],timeOfNextTour[4]));
    var _second = 1000;
    var _minute = _second * 60;
    var _hour = _minute * 60;
    var _day = _hour * 24;

    var distance = end-now;

    var hours = Math.floor((distance % _day) / _hour);
    var minutes = Math.floor((distance % _hour) / _minute);
    if (hours === 5 && minutes > 40) { 
        text += 'The Official Tournament should be starting now. Metagame: ' + BLT.nextMeta;
    } else {
        //text += 'The next Official Tour for the Monotype Monthly Championship will be in ';
        text += 'The next Official Monotype Tournament will be ' + BLT.nextMeta + ' and starts in ';

        if (hours === 1) {
        text += '1 hour and ';
        } else if (hours) {
        text += hours + ' hours and ';
        }
        if (minutes === 1) {
        text += '1 minute.';
        } else {
        text += minutes + ' minutes.';
        }
    } 
    this.say(room, text);
    },
    /***********************************/
    /* Monotype Informational Commands */
    /***********************************/    
    hub: function(arg, by, room) {
    if (this.hasRank(by, '+%@#&~') || room.charAt(0) === ',') {
        var text = '';
    } else {
        var text = '/pm ' + by + ', ';
    }
    text += 'Smogon\'s Monotype Hub (Analyses, Sample Teams, Viability Rankings and Role Compendium): http://www.smogon.com/tiers/om/monotype/';
    this.say(room, text);
    },
    maintenance: function(arg, by, room) {
    if (room.charAt(0) === ',') {
        var text = '';
    } else {
        var text = '/pm ' + toId(by) + ', ';
    }
    text += 'This command is currently under maintenance.';
    this.say(room, text);
    },
    st: 'teamarchive',
    samples: 'teamarchive',
    sampleteams: 'teamarchive',
    teams: 'teamarchive',
    archive: 'teamarchive',
    teamarchive: function(arg, by, room) {
    var text = '';
    if (this.hasRank(by, '+%@#&~')) {
        text = 'Monotype\'s Team Archive: http://www.smogon.com/forums/threads/monotype-sample-teams.3599682/#post-7292576';
    } else {
        text = '/pm ' + by + ', Monotype\'s Team Arichive: http://www.smogon.com/forums/threads/monotype-sample-teams.3599682/#post-7292576';
    }
    this.say(room, text);
    },

    seasonal: function(arg, by, room) {
    if (this.hasRank(by, '+%@#&~') || room.charAt(0) === ',') {
        var text = '';
    } else {
        var text = '/pm ' + by + ', ';
    }
    text += 'Click here to sign up for monotype seasonal: http://www.smogon.com/forums/threads/monotype-fall-seasonal-ii-signups.3616683/';
    this.say(room, text);
    },
    baconlettucetomato: 'blt',
    blt: function(arg, by, room) {
    if (this.hasRank(by, '+%@#&~') || room.charAt(0) === ',') {
        var text = '';
    } else {
        var text = '/pm ' + by + ', ';
    }
    text += 'Information on the Monotype Best Leaderboard Tournament: http://www.smogon.com/forums/threads/monotype-blt.3627208/';
    this.say(room, text);
    },

    suspect: function(arg, by, room) {
    if (this.hasRank(by, '+%@#&~') || room.charAt(0) === ',') {
        var text = '';
    } else {
        var text = '/pm ' + by + ', ';
    }
    text += "Shadow Tag is currently being suspected! Find out more here: http://www.smogon.com/forums/threads/sm-monotype-suspect-3-shadow-tag.3617517/";
    this.say(room, text);
    },

    bl: 'banlist',
    banlist: function(arg, by, room) {
    if (this.hasRank(by, '+%@#&~') || room.charAt(0) === ',') {
        var text = '';
    } else {
        var text = '/pm ' + by + ', ';
    }
    switch (toId(arg)) {
        //maybe add in things like aaa?
        case '5':
        case 'gen5ou':
        case 'gen5':
        case 'bw':
        text += 'BW Monotype follows the BW OU banlist.';
        break;
        case '6':
        case 'oras':
        case 'xy':
        case 'gen6':
        text += 'The Gen 6 Monotype banlist can be found here: http://www.smogon.com/dex/xy/formats/monotype/';
        break;
        default:
        text += 'The Gen 7 Monotype banlist can be found here: http://www.smogon.com/dex/sm/formats/monotype/.';
        break;
    }
    this.say(room, text);
    },

    discussion: 'tiering',
    tiering: function(arg, by, room) {
    if (this.hasRank(by, '+%@#&~') || room.charAt(0) === ',') {
        var text = '';
    } else {
        var text = '/pm ' + by + ', ';
    }
    text += 'The Monotype Discussion/Tiering thread can be found at: http://www.smogon.com/forums/threads/monotype-metagame-discussion.3587204/';
    this.say(room, text);
    },

    gc: 'goodcores',
    goodcores: function(arg, by, room) {
    if (this.hasRank(by, '+%@#&~') || room.charAt(0) === ',') {
        var text = '';
    } else {
        var text = '/pm ' + by + ', ';
    }
    text += 'The Monotype Good Cores thread can be found at: http://www.smogon.com/forums/threads/monotype-good-cores.3589407/';
    this.say(room, text);
    },

    stats: function(arg, by, room) {
    /*var text = '';
    if (this.hasRank(by, '+%@#&~')) {

        text += '/addhtmlbox <div style="text-align:center;"><a style="font-size:15px; font-weight: bold;" href="stats.monotypeps.com#monotype-1630">Monotype Usage Stats</a><p>The Pokemon Showdown inter-site link thing will sometimes mess up this link.<br/>If this happens, just <span style="color:darkred; font-weight:bold;">copy/paste</span> <span style="color:red;">stats.monotypeps#monotype-1630</span> into your browser.</p></div>';
    } else if (room.charAt(0) === ',') {
        text += 'Monotype Usage Stats: stats.monotypeps.com#monotype-1630'; 
    } else {
        text += '/pm ' + by + ', Monotype Usage Stats: stats.monotypeps.com#monotype-1630';
    }
    this.say(room, text);*/
    this.say(room, 'Monotype usage statistics are currently down, but may be recreated at some point in the future.');
    //rip stats
    },

    vr: 'viabilityrankings',
    viabilityrankings: function(arg, by, room) {
    if (this.hasRank(by, '+%@#&~') || room.charAt(0) === ',') {
        var text = '';
    } else {
        var text = '/pm ' + by + ', ';
    }
    text += 'The Monotype Viability Rankings thread can be found at: http://www.smogon.com/forums/threads/monotype-usum-viability-rankings.3622349/';
    this.say(room, text);

    },

    mpl: 'monopl',
    monopl: function(arg, by, room) {
    if (this.hasRank(by, '+%@#&~') || room.charAt(0) === ',') {
        var text = '';
    } else {
        var text = '/pm ' + by + ', ';
    }
    text += 'There is no Monotype Premier League currently being played.';
    this.say(room, text);
    },

//tbc stuff used to go here. Gone now, IDK if it's actually used but I'm sure I'll find out if it is <_<

    /************************** 
    * Monotype Forum Projects *
    **************************/
    //activity notes for this section are from 25/04/17. Probably worth updating at some point later on.

    mmm:  'match',
    match: function(arg, by, room) { //on standby, IDK If it'll return
    if (room.charAt(0) === ',') {
        var text = 'The Monotype Matchmaking project can be found at: http://www.smogon.com/forums/threads/monotype-matchmaking-standby.3590970/';
    } else if (this.hasRank(by, '+%@#&~') ) {
        var text = '/addhtmlbox <div style="width: 100%; overflow-x: auto; overflow-y: auto; font-family: Verdana,Geneva,sans-serif; padding: 10px 0px;"> <div style="width: 610px; background: transparent; position: relative; margin: 0 auto; text-align:center;"> <div style="margin-bottom: 8px; font-size:18px; font-weight: bold; "><a style="color:darkred; z-index:2;" href="http://www.smogon.com/forums/forums/monotype.365/?prefix_id=305" target="_blank">Monotype Forum Projects!</a></div><a href="http://www.smogon.com/forums/threads/.3572623/" target="_blank"> <img src="http://i.imgur.com/uZpWZ76.png" width=550px height=167px alt="logo"/> </a> <div style="font-size: 13px;">The <i>Monotype Matchmaking</i> project challenges you to find the perfect teammate for a specific Pokemon. A winner is crowned by a community vote at the end of each cycle. </div><div style="font-size: 13px; margin-top:4px;">Click the image to provide the perfect teammate to complement this week\'s Pokemon!</div></div></div>';
    } else {
        var text = '/pm ' + by + ', ';
        text += 'The Monotype Matchmaking project can be found at: http://www.smogon.com/forums/threads/monotype-matchmaking-standby.3590970/';
    }
    this.say(room, text);
    },
    whl: 'last',
    last: function(arg, by, room) { //active
    if (room.charAt(0) === ',') {
        var text = 'The What\'s His Last? project can be found at: http://www.smogon.com/forums/threads/whats-his-last-index.3591601/';
    } else if (this.hasRank(by, '+%@#&~') ) {
        var text = '/addhtmlbox <div style="width: 100%; overflow-x: auto; overflow-y: auto; font-family: Verdana,Geneva,sans-serif; padding: 10px 0px;"> <div style="width: 610px; background: transparent; position: relative; margin: 0 auto; text-align:center;"> <div style="margin-bottom: 8px; font-size:18px; font-weight: bold; "><a style="color:darkred; z-index:2;" href="http://www.smogon.com/forums/forums/monotype.365/?prefix_id=305" target="_blank">Monotype Forum Projects!</a></div><a href="http://www.smogon.com/forums/threads/.3577229/" target="_blank"> <img src="http://i.imgur.com/YCIxERV.png" width=550px height=214px alt="logo"/> </a> <div style="font-size: 13px;">This project gives you 5 Pokemon, then challenges you to figure out: <i>What\'s His Last?</i>.</div><div style="font-size: 13px; margin-top:4px;">Click the image to provide the perfect Pokemon to complete this week\'s team!</div></div></div>';
    } else {
        var text = '/pm ' + by + ', ';
        text += 'The What\'s His Last? project can be found at: http://www.smogon.com/forums/threads/whats-his-last-index.3591601/';
    }
    this.say(room, text);
    },
    btt: 'break',
    break: function(arg, by, room) { //active
    if (room.charAt(0) === ',') {
        var text = 'The Break This Team project can be found at: http://www.smogon.com/forums/threads/monotype-break-this-team-index.3588593/';
    } else if (this.hasRank(by, '+%@#&~') ) {
        var text = '/addhtmlbox <div style="width: 100%; overflow-x: auto; overflow-y: auto; font-family: Verdana,Geneva,sans-serif; padding: 10px 0px;"> <div style="width: 610px; background: transparent; position: relative; margin: 0 auto; text-align:center;"> <div style="margin-bottom: 8px; font-size:18px; font-weight: bold; "><a style="color:darkred; z-index:2;" href="http://www.smogon.com/forums/forums/395/" target="_blank">Monotype Forum Projects!</a></div><a href="http://www.smogon.com/forums/threads/3588593/" target="_blank"> <img src="http://i.imgur.com/oiepxTg.jpg" width=375px height=239px alt="logo"/> </a> <div style="font-size: 13px;">The <i>Break This Team</i> project examines how to break common team archetypes in the Monotype metagame. A winner is crowned by a community vote at the end of each cycle.</div><div style="font-size: 13px; margin-top:4px;">Click the image to show how <i>you</i> break through Monotype teams!</div></div></div>';
    } else {
        var text = '/pm ' + by + ', ';
        text += 'The Break This Team project can be found at: http://www.smogon.com/forums/threads/monotype-break-this-team-index.3588593/';
    }
    this.say(room, text);
    },
    votw: 'victim',
    victim: function(arg, by, room) { //inactive, but not actively locked. Possible it could come back.
    if (room.charAt(0) === ',') {
        var text = 'The Monotype Victim of the Week project can be found at: http://www.smogon.com/forums/threads/monotype-featured-victim-index.3590184/';
    } else if (this.hasRank(by, '+%@#&~') ) {
        var text = '/addhtmlbox <div style="width: 100%; overflow-x: auto; overflow-y: auto; font-family: Verdana,Geneva,sans-serif; padding: 10px 0px;"> <div style="width: 550px; background: transparent; position: relative; margin: 0 auto; text-align:center;"> <div style="margin-bottom: 8px; font-size:18px; font-weight: bold; "><a style="color:darkred; z-index:2;" href="http://www.smogon.com/forums/forums/monotype.365/?prefix_id=305" target="_blank">Monotype Forum Projects!</a></div><a href="http://www.smogon.com/forums/threads/.3574356/" target="_blank"> <img src="http://i.imgur.com/d386tmn.png" width=450px height=247px alt="logo"/> </a> <div style="font-size: 13px;">The community showcases checks and counters to the biggest threats in the Monotype metagame in the Vicitim of the Week project.</div><div style="font-size: 13px; margin-top:4px;">Click the image to share your metagame knowledge!</div></div></div>';
    } else {
        var text = '/pm ' + by + ', ';
        text += 'The Monotype Victim of the Week project can be found at: http://www.smogon.com/forums/threads/monotype-featured-victim-index.3590184/';
    }
    this.say(room, text);
    },
    theorymon: function(arg, by, room) { //active
    if (room.charAt(0) === ',') {
        var text = 'The Monotype Theorymon project can be found at: http://www.smogon.com/forums/threads/monotype-theorymon-standby.3589576/';
    } else if (this.hasRank(by, '+%@#&~') ) {
        var text = '/addhtmlbox <div style="width: 100%; overflow-x: auto; overflow-y: auto; font-family: Verdana,Geneva,sans-serif; padding: 10px 0px;"> <div style="width: 610px; background: transparent; position: relative; margin: 0 auto; text-align:center;"> <div style="margin-bottom: 8px; font-size:18px; font-weight: bold; "><a style="color:darkred; z-index:2;" href="http://www.smogon.com/forums/forums/monotype.365/?prefix_id=305" target="_blank">Monotype Forum Projects!</a></div><a href="http://www.smogon.com/forums/threads/.3572971/" target="_blank"> <img src="http://i.imgur.com/OhXtEmf.png" width=550px height=141px alt="logo"/> </a> <div style="font-size: 13px;">The Theorymon project lets you customize under-used Pokemon from a particular type (new stats, abilities, moves, etc.) to make it more viable in the Monotype metagame.</div><div style="font-size: 13px; margin-top:4px;">Click the image to showcase your own theorymon creation!</div></div></div>';
    } else {
        var text = '/pm ' + by + ', ';
        text += 'The Monotype Theorymon project can be found at: http://www.smogon.com/forums/threads/monotype-theorymon-standby.3589576/';
    }
    this.say(room, text);
    },
//previously here: workshop, which is dead.
    tbc: function(arg, by, room) {

    if (room.charAt(0) === ',') {
        var text = 'The Monotype Team Building Competition can be found at: http://www.smogon.com/forums/threads/monotype-teambuilding-competition-v3-2-index.3600803/';
        this.say(room, text);
    } else if (this.hasRank(by, '+%@#&~') ) {
        //if no HTMLbox code
        if (!HTML.tbc) {
        var text = 'The Monotype Team Building Competition can be found at: http://www.smogon.com/forums/threads/monotype-teambuilding-competition-v3-2-index.3600803/';
        this.say(room, text);
        return;
        }

        //90% sure I can scrap everything beyond this point

        //stuff to get image sizes
        var url = require('url');
        var http = require('http');
        var sizeOf = require('image-size');

        var image1 = '';
        var image2 = '';
        var text = '/addhtmlbox ';

        //image 1
        var imgUrl = 'http://play.pokemonshowdown.com/sprites/xyani/' + HTML.tbc["mon1"] + '.gif';
        var options = url.parse(imgUrl);
        http.get(options, function(response) {
        var chunks = [];
        response.on('data', function(chunk) {
            chunks.push(chunk);
        }).on('end', function() {
            var buffer = Buffer.concat(chunks);
            image1 = sizeOf(buffer);
            console.log(image1)

        //TODO: callbacks suck. I really need to learn a better way to do this!
        //image 2
            imgUrl = 'http://play.pokemonshowdown.com/sprites/xyani/' + HTML.tbc["mon2"] + '.gif';
            options = url.parse(imgUrl);
            http.get(options, function(response) {
            var chunks = [];
            response.on('data', function(chunk) {
                chunks.push(chunk);
            }).on('end', function() {
                var buffer = Buffer.concat(chunks);
                image2 = sizeOf(buffer);

                console.log(image2)
                // now actually create the html box for chat!
                var typeColors = {
                "Bug":"160, 191, 4",
                "Dark":"38, 35, 32",
                "Dragon":"112, 56, 248",
                "Electric":"251, 188, 0",
                "Fairy":"255, 101, 213",
                "Fighting":"144, 48, 40",
                "Fire":"255, 39, 0",
                "Flying":"178, 130, 242",
                "Ghost":"112, 88, 152",
                "Grass":"120, 200, 80",
                "Ground":"227, 194, 96",
                "Ice":"135, 220, 218",
                "Normal":"166, 171, 118",
                "Poison":"160, 64, 160",
                "Psychic":"255, 36, 130",
                "Rock":"185, 163, 43",
                "Steel":"184, 184, 208",
                "Water":"106, 135, 243",
                };
                text+='<div style="width: 100%; overflow-x: auto; overflow-y: hidden; font-family: Verdana,Geneva,sans-serif; ">';
                text+='<div style="width: 400px; min-height: 190px; background: transparent; position: relative; margin: 0 auto; text-align:center;">';
                text+='<div>';
                text+='<a href="' + HTML.tbc["threadLink"] + '" target="_blank" style="font-size: 18px; color: rgb(183,67,69); font-weight: bold;">Monotype Team Building Competition</a>';
                text+='</div>';
                text+='<div style="background-color: rgba(' + typeColors[HTML.tbc["type"]] + ',0.5); border: 3px solid rgba(' + typeColors[HTML.tbc["type"]] + ',1); border-radius: 10px; padding: 10px; display: inline-block; margin-bottom: 5px; margin-top: 8px;">';
                text+='<div style="font-size: 13px; line-height: 16px; margin-bottom: 2px;">Current Challenge: <img src="http://play.pokemonshowdown.com/sprites/types/' + HTML.tbc["type"] + '.png" alt="type" height=14px width=32px /></div>';
                // text+='<div style="font-size: 11px; margin-bottom: 8px;">ends ' + HTML.tbc["endDate"] + '</div>';
                text+='<img src="http://play.pokemonshowdown.com/sprites/xyani/' + HTML.tbc["mon1"] + '.gif" height=' + image1.height + 'px width=' + image1.width + 'px alt=mon1 style="margin-right: 20px;" />';
                text+='<img src="http://play.pokemonshowdown.com/sprites/xyani/' + HTML.tbc["mon2"] + '.gif" height=' + image2.height + 'px width=' + image2.width + 'px alt=mon2 />';
                text+='</div>';
                text+='</div>';
                text+='</div>';
                console.log(room + '|' + text);
                send(room + '|' + text);
            });
            });
        });
        });
    } else {
        var text = '/pm ' + by + ', ';
        text += 'The Monotype Team Building Competition can be found at: http://www.smogon.com/forums/threads/monotype-teambuilding-competition-v3-2-index.3600803/';
        this.say(room, text);
    }
    },
//previously here: teambuilding, which while potentially useful was gen 6 so I decided to remove it.
    coil: function(arg, by, room) {
    if (!(room.charAt(0) === ',')) return;

    send("|/pm " + by + ", " + "use /rank to view your coil!");
    },

/*        try { //remaining code potentially still useful for other things that might use it? IDK
        var http = require("http");

        var doStuff = function(userLadderInfo, monoIndex) { //great function name scp, thanks so much for how helpful it is
        if (monoIndex > -1) {
            var tag = '';
            var B = 14;
            var C = 2800;
            var gameLimit = 70;
            var N = parseInt(userLadderInfo[monoIndex]["w"]) + parseInt(userLadderInfo[monoIndex]["l"]) + parseInt(userLadderInfo[monoIndex]["t"]);
            var GXE = userLadderInfo[monoIndex]["gxe"];
            var COIL = 40*GXE*Math.pow(2,(-1*B/N));
            var gamesLeft = Math.ceil((B/(Math.log(40*GXE/C) / Math.log(2))) - N);
            var summaryForConsole= userid + ': ' + Math.floor(COIL) + " W: " + userLadderInfo[monoIndex]["w"] + " L: " + userLadderInfo[monoIndex]["l"] + " GXE: " + userLadderInfo[monoIndex]["gxe"] + " B: 16.";

            if (COIL < C) console.log(summaryForConsole.blue.bold);
            else if (COIL >= C && toId(userid.substr(0, tag.length)) === toId(tag) && N < gameLimit) {
            console.log(summaryForConsole.green.bold);
            } else {
            console.log(summaryForConsole.red.bold);
            }

            if (COIL < C) {
            if (toId(userid.substr(0, tag.length)) === toId(tag)) {
                send("|/pm " + by + ", " + userid + "'s current COIL is: **" + Math.floor(COIL) + "**. A COIL of " + C + " in less than " + gameLimit + " games is required to vote in the suspect test.");
            } else {
                send("|/pm " + by + ", " + userid + "'s current COIL is: **" + Math.floor(COIL) + "**. A COIL of " + C + " in less than " + gameLimit + " games on an account that starts with the " + tag + " tag is required to vote in the suspect test.");
            }
            } else {
            if (toId(userid.substr(0, tag.length)) === toId(tag) && N <= gameLimit) {
                send("|/pm " + by + ", " + userid + "'s current COIL is: **" + Math.floor(COIL) + "**. They may vote in the suspect test!");
            } 
            else if (toId(userid.substr(0, tag.length)) === toId(tag) && N > gameLimit) {
                send("|/pm " + by + ", " + userid + "'s current COIL is: **" + Math.floor(COIL) + "**, but they have played more than the game limit of " + gameLimit + " games.");
            } else {
                send("|/pm " + by + ", " + userid + "'s current COIL is: **" + Math.floor(COIL) + "**. A COIL of " + C + " in less than " + gameLimit + " games on an account that starts with the " + tag + " tag is required to vote in the suspect test.");
            }
            }
            send("|/pm " + by + ", " + "This value was calculated using the following info (let DoW know if it is incorrect): W: " + userLadderInfo[monoIndex]["w"] + " L: " + userLadderInfo[monoIndex]["l"] + " GXE: " + userLadderInfo[monoIndex]["gxe"] + " B: " + B + ".");
        } else {
            send("|/pm " + by + ", " + userid + " has not played any monotype games yet!");
        }
        };

        var userid = toId(by);
        if (arg) userid = toId(arg);

        var options = {
          host: 'play.pokemonshowdown.com',
          path: '/~~showdown/action.php?act=ladderget&user=' + userid
        };

        http.get(options, function(http_res) {
        var data = "";
        http_res.on("data", function(chunk) {
            data += chunk;
        });
        http_res.on("end", function() {

            try{
            var userLadderInfo = JSON.parse(data.substr(1));
            } catch (e) {
            console.log('@@@@@ error parsing JSON from PS! @@@@@');
            console.log(e);
            console.log(data);
            return;
            }

            var monoIndex
            var i = 0;
            while (i < userLadderInfo.length) {
            if (userLadderInfo[i].formatid === 'gen7monotypesuspecttest') { //updated this from 'monotype'. May break the code, IDK
                monoIndex = i;
                break;
            }
            i++;
            }
            doStuff(userLadderInfo, monoIndex);
        });
        });
    } catch(e) {
        console.log(e);
    }
    },*/

    addchallenge: function(arg, by, room) {
    if (!(room.charAt(0) === ',')) return;
    if (['scpinion', 'bondie', 'acast', 'dece1t', 'dow'].indexOf(toId(by)) > -1 ) {
        var ccInfo = JSON.parse(arg);
        HTML.cc[ccInfo["num"]] = ccInfo;
        HTML.cc[ccInfo["num"]]["threadLink"] = "http://www.smogon.com/forums/threads/monotype-core-laddering-challenge-cycle-7.3572780/";
        HTML.cc[ccInfo["num"]]["challengeLink"] = "http://www.smogon.com/forums/threads/monotype-core-laddering-challenge-cycle-7.3572780/";
        console.log(HTML.cc);
        var fs = require('fs');
        fs.writeFile("ccInfo.json", JSON.stringify(HTML.cc), function(err) {
        if (err) {
            send('monotype' + '|/pm dow, error updating ccInfo.')
            return console.log(err);
        }
        });
    }
    },
    addchallengethread: function(arg, by, room) {
    if (!(room.charAt(0) === ',')) return;
    if (['scpinion', 'bondie', 'acast', 'dece1t', 'dow'].indexOf(toId(by)) > -1 ) {
        var stuff = arg.split('~');
        console.log(stuff)
        HTML.cc[stuff[0]]["threadLink"] = stuff[1];
        var fs = require('fs');
        fs.writeFile("ccInfo.json", JSON.stringify(HTML.cc), function(err) {
        if (err) {
            send('monotype' + '|/pm dow, error updating ccInfo.')
            return console.log(err);
        }
        });
    }
    },
    addchallengelink: function(arg, by, room) {
    if (!(room.charAt(0) === ',')) return;
    if (['scpinion', 'bondie', 'acast', 'dece1t', 'dow'].indexOf(toId(by)) > -1 ) {
        var stuff = arg.split('~');
        console.log(stuff)
        HTML.cc[stuff[0]]["challengeLink"] = stuff[1];
        var fs = require('fs');
        fs.writeFile("ccInfo.json", JSON.stringify(HTML.cc), function(err) {
        if (err) {
            send('monotype' + '|/pm dow, error updating ccInfo.')
            return console.log(err);
        }
        });
    }
    },
/*  standings: function(arg, by, room) {
    if (room.charAt(0) === ',' && toId(by)!== config.owner) {
        var text = 'The BLT Standings can be found here: http://monotypeps.com/blt/';
    } else if (this.hasRank(by, '+%@#&~')) {

        //check for input, if no input use current season/week
        var stuff = arg.split(',');
        if (stuff[0] && stuff[1]) {
        var season = stuff[0].trim();
        var week = stuff[1].trim();
        if (!BLT.tourLog[season][week]) {
            season = BLT.season;
            week = BLT.week;
        }
        } else {
        var season = BLT.season;
        var week = BLT.week;
        }
        if (!BLT.tourLog[season][week]) {
        this.say(room, 'There are no standings for this season/week');
        return;
        }

        //parse the Tour Log
        var playerDatabase = {};
        console.log(BLT.tourLog[season][week].length)
        console.log(BLT.metas[season])
        for (var t in BLT.tourLog[season][week]) {
        var tour = BLT.tourLog[season][week][t];
        var top4 = tour.top4;
        if (!BLT.metas[season].hasOwnProperty(toId(tour.metagame))) {
            console.log('!!!!!!!!!!!!!!!!!!!!!skipped:');
            console.log(tour);
            continue;
        } 
        for (var p in top4) {
            var player = toId(top4[p]);
            if (!playerDatabase.hasOwnProperty(player)) {

            playerDatabase[player] = {
                points: {},
                results:{},//"cap":[0,0,0], "monotype":[0,0,0], "ltm":[0,0,0], "ubers":[0,0,0], "dpp":[0,0,0], "lc":[0,0,0]},
                displayName: top4[p]
            };
            for (var m in BLT.metas[season]) {
                playerDatabase[player]["points"][m] = 0;
            }
            playerDatabase[player]["points"]["total"] = 0;
            }
            //console.log("p: " + p);
            //1st place
            if (p == 0) {
            playerDatabase[player]["points"]["total"] = playerDatabase[player]["points"]["total"] + 3;
            playerDatabase[player]["points"][tour.metagame] = playerDatabase[player]["points"][tour.metagame] + 3;
            //playerDatabase[player]["results"][tour.metagame][0]++;
            }

            //2nd place
            if (p == 1) {
            playerDatabase[player]["points"]["total"] = playerDatabase[player]["points"]["total"] + 2;
            playerDatabase[player]["points"][tour.metagame] = playerDatabase[player]["points"][tour.metagame] + 2;
            //playerDatabase[player]["results"][tour.metagame][1]++;
            }

            //3rd place
            if (p > 1) {
            playerDatabase[player]["points"]["total"] = playerDatabase[player]["points"]["total"] + 1;
            playerDatabase[player]["points"][tour.metagame] = playerDatabase[player]["points"][tour.metagame] + 1;
            //playerDatabase[player]["results"][tour.metagame][2]++;
            }
        }
        }
        //console.log(playerDatabase)
        //create a sortable version of the Player Database
        var sortable = []; //WTF IS THE SPACING HAPPENING HERE? LIKE, WHAT
        for (var player in playerDatabase)
        sortable.push([player, playerDatabase[player]["points"]["total"]])
        sortable.sort(function(a, b) {
            return b[1] - a[1]
        });

        var text = '/addhtmlbox ';
        text += '<div style="width: 100%; overflow-x: auto; font-family: Verdana,Geneva,sans-serif; ">';
        text += '<div style="width: 595px; height: 240px; overflow-y: scroll; background: transparent; position: relative; margin: 0 auto; text-align:center;">';
        text += '<div style="font-size: 18px; margin-bottom: 8px;"> <a href="http://monotypeps.com/blt/" target="_blank"> Monotype BLT Standings</a></div> '
        text += '<table style="border-collapse:separate; border-spacing: 3px 3px; color:black; font-size: 13px; width:auto; margin: 0px; table-layout: fixed; padding-right: 10px; text-align: center;">'
        text += '<thead style=background-color:#ddd; font-weight: bold;">'
        text += '<tr style="padding: 5px 5px 5px 10px; margin: 0px;">';
        text += '<th style="padding: 5px 5px 5px 10px; margin: 0px;">Rank</th>';
        text += '<th style="padding: 5px 5px 5px 10px; margin: 0px;">Name</th>';
        text += '<th id=\"points\" style="padding: 5px 5px 5px 10px; margin: 0px;">Points</th>';
        for (var m in BLT.metas[season]) {
            text += '<th style="padding: 5px 5px 5px 10px; margin: 0px;">' + m + '</th>';
        }
        text += '</tr></thead><tbody>';
        var tableLength = 20;
        if (sortable.length < 20) tableLength = sortable.length;
        for(var p=0; p < tableLength; p++) {
        player = sortable[p][0]
        var val = playerDatabase[player]
        //console.log(val)
        var style = '';
        if (p%2 === 0 ) {
            style = 'style="padding: 5px 5px 5px 10px; margin: 0px; background: #b3b3ff;"'
        }else {
            style = 'style="padding: 5px 5px 5px 10px; margin: 0px; background: #9999ff;"'
        }
        text += '<tr style="padding: 5px 5px 5px 10px; margin: 0px;">';
        text += ' <td ' + style + '>' + (p + 1) + "</td>";
        text += ' <td ' + style + '>' + val["displayName"] + "</td>";
        text += ' <td ' + style + '>' + val["points"]["total"] + "</td>";
        for (var m in BLT.metas[season]) {
            text += ' <td ' + style + '>' + val["points"][m] + "</td>";
        }
        text += "</tr>";
        }
        text+= "</tbody></table></div></div>";
        console.log(text);
    } else {
        var text = '/pm ' + by + ', ';
        text += 'The BLT Standings can be found here: http://monotypeps.com/blt/';
    }
    this.say(room, text);
    },*/

    monotypeprojects: 'projects',
    monoprojects: 'projects',
    project: 'projects',
    projects: function(arg, by, room) {
    function aliases(inpt) {
        switch (toId(inpt)) {
        case 'last':
        case 'whl':
        case 'whatshislast': 
            return 'What\'s his last?';
        case 'mclc':
        case 'core':
        case 'coreladder':
        case 'coreladdering':
        case 'ladderchallenge':
        case 'ladderingchallenge':
        case 'coreladderchallenge':
        case 'coreladderingchallenge':
        case 'monocoreladderchallenge':
        case 'monocoreladderingchallenge': 
            return 'Monotype Core Laddering Challenge';
        case 'theory':
        case 'theorymon':
        case 'monotheory':
        case 'monotheorymon':
        case 'monotypetheory':
        case 'monotypetheorymon': 
            return'Monotype Theorymon';
        case 'btt':
        case 'mbtt':
        case 'break':
        case 'breakthisteam':
        case 'monobreakthisteam':
        case 'monotypebreakthisteam':
            return 'Monotype Break This Team';
        case 'mle':
        case 'ladder':
        case 'expert':
        case 'experts':
        case 'ladderexperts':
        case 'monoladder':
        case 'monotypeladder':
        case 'monoladderexperts':
        case 'monotypeladderexperts':
            return  'Monotype Ladder Experts';
        case 'mtc':
        case 'team':
        case 'teamcomp':
        case 'teambuilding':
        case 'teamcompetition':
        case 'teambuildingcomp':
        case 'teambuildingcompetition':
        case 'monoteam':
        case 'monoteambuilding':
        case 'monotypeteambuilding':
        case 'monoteamcomp':
        case 'monoteambuildingcomp':
        case 'monoteamcompetition':
        case 'monoteambuildingcompetition':
        case 'monotypeteambuildingcompetition':
            return 'Monotype Teambuilding Competition';
        //no default, returning null does as good a job as anything else
        };
    };

    var all_projects = {
        //'name': ['description','link'],
        'What\'s his last?': ['A monotype project where 5 pokemon are listed and you submit the 6th pokemon!','http://www.smogon.com/forums/threads/whats-his-last-index.3591601/'],
        'Monotype Core Laddering Challenge': ['A monotype project where you\'re given a core of two pokemon, build a team, and see who can get the highest on the ladder!','http://www.smogon.com/forums/threads/monotype-core-laddering-challenge-index-thread.3589318/'],
        'Monotype Theorymon': ['A monotype project where three pokemon are given and you choose what you\'d change to make them more viable!','http://www.smogon.com/forums/threads/monotype-theorymon-index.3589576/'],
        'Monotype Break This Team': ['A monotype project where a team is listen, then you choose 2-3 pokemon that would defeat it!','http://www.smogon.com/forums/threads/monotype-break-this-team-index.3588593/'],
        'Monotype Ladder Experts': ['A monotype project where you\'re given an archetype to build a team around, then win battles on the ladder for leaderboard points!','http://www.smogon.com/forums/threads/monotype-ladder-experts-index.3599335/'],
        'Monotype Teambuilding Competition': ['A monotype project where you\'re given 1-2 pokemon to build a team around, then vote on the winner!','http://www.smogon.com/forums/threads/monotype-teambuilding-competition-v3-2-index.3600803/'],
    };

    var this_name = aliases(arg);

    if (!this.hasRank(by, '%@&#~') || room.charAt(0) === ',') { //can't !htmlbox
        if (!this_name) {
        this.say(room, '/pm ' + toId(by) + ', Projects: What\'s his last, Core Laddering Challenge, Theorymon, Break This Team, Ladder Experts, Teambuilding Competition.');
        this.say(room, '/pm ' + toId(by) + ', Use .projects <project name> for more info.');
        return;
        }
        this.say(room, '/pm ' + toId(by) + ', ' + this_name + ': ' + all_projects[this_name][0]);
        this.say(room, '/pm ' + toId(by) + ', To find out more, follow this link: ' + all_projects[this_name][1]);
        return;
    }

    if (this_name) { //info for specific project (given in arg)
        this.say(room, this_name + ': ' + all_projects[this_name][0]);
        this.say(room, 'To find out more, follow this link: ' + all_projects[this_name][1]);
    } else { //generate !htmlbox for all projects
        var to_say = '!htmlbox <table style="width:100%"><tr><th>Project</th><th>Description</th></tr>';
        for (var i in all_projects) {
        to_say += '<tr><td><a href="' + all_projects[i][1] + '">' + i + '</a></td><td>' + all_projects[i][0] + '</td></tr>';
        }
        to_say += '</table>';
        this.say(room, to_say);
    }
    },

    /****************************/
    /* Chat Moderation Commands */
    /****************************/

/*    blacklist: 'autoban',
    ban: 'autoban',
    ab: 'autoban',
    autoban: function(arg, by, room) {
    return;
    if (room.charAt(0) === ',') return false;
    if (!this.hasRank(by, '@#&~')) return this.say(room, config.nick + ' requires rank of @ or higher to (un)blacklist.');

    var user = arg;
    ModerateChat.blacklist.push(toId(user))

    var fs = require('fs');
    fs.writeFile("blacklist.json", JSON.stringify(ModerateChat.blacklist), function(err) {
        if (err) {
        send('monotype' + '|' + user + ' error adding the user to the blacklist. Ban/Mute them and let scp know about this error.')
        return console.log(err);
        }
        console.log(user + " was added to the blacklist");
        if (toId(room) === 'monotype') {
        send(room + '|' + user + ' has been added to the blacklisted')
         send(room + '|/roomban ' + user + ', blacklisted user')
        }
    });
    },

    unblacklist: 'unautoban',
    unban: 'unautoban',
    unab: 'unautoban',
    unautoban: function(arg, by, room) {
    return;
    if (room.charAt(0) === ',') return false;
    if (!this.hasRank(by, '@#&~')) return this.say(room, config.nick + ' requires rank of @ or higher to (un)blacklist.');

    var user = arg;
    var index = ModerateChat.blacklist.indexOf(toId(user));

    if (index > -1) {
        ModerateChat.blacklist.splice(index, 1);

        var fs = require('fs');
        fs.writeFile("blacklist.json", JSON.stringify(ModerateChat.blacklist), function(err) {
        if (err) {
            return console.log(err);
        }
        console.log(user + " was removed from the blacklist");
        if (toId(room) === 'monotype') {
            send(room + '|' + user + ' has been removed to the blacklisted');
             send(room + '|/roomunban ' + user);
        }
        });
    }
    },
*/
    modchat: function(arg, by, room) {
    if (this.hasRank(by, '%@#&~')) {
        var text = '/modchat ac';
    } else {
        var text = '/pm ' + by + ', Only room staff may use this command.';
    }
    this.say(room, text);
    },

    /************************/
    /* General Use Commands */
    /************************/
    update: 'reload',
    reload: function(arg, by, room) {
    if (!this.hasRank(by, '#~')) return false;
    try {
        this.uncacheTree('./commands.js');
        Commands = require('./commands.js').commands;
        if (toId(by) === 'bondie') {
        this.say(room, 'Automated Response: y\'know I think you\'re just trying to show off and look important :P');
        } else {
        this.say(room, 'Commands reloaded!');
        }
    } catch (e) {
        error('failed to reload: ' + sys.inspect(e));
    }
    },
    hasrank: 'hasRank',
    hasRank: function(user, rank) {
    var hasRank = (rank.split('').indexOf(user.charAt(0)) !== -1) || (config.excepts.indexOf(toId(user)) !== -1);
    return hasRank;
    },
    canuse: 'canUse',
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
    rof: function(arg, by, room) {
    switch (toId(by)) {
        case 'deathonwings':
            text = 'This is the gospel of Rof: Praise Rof, Massage Rof, Tan Rof! This is the gospel of Rof.';
            break;
        case 'dow':
            text = 'I\'ll be back when my internet\'s fixed, dw.';
            break;
        case 'scpinion':
            text = 'Are DEG ruining the Monotype Metagame?';
            break;
        case 'dreameatergengar':
            text = 'ur a nub lol :^)';
            break;
        case 'bondie':
            text = 'DoWbot.js > Botie.js js';
            break;
        case 'theimmortal':
            text = 'ti more like n';
            break;
        case 'urkerab':
            text = 'wait you\'re not a bot ?_?';
            break;
        case 'betathunder':
            text = 'something MEMEY';
            break;
        default:
            text = '/pm ' + by + ', You\'re not tanned enough to use .rof!';
            break;
    }
    this.say(room, text);
    },
};
