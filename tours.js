exports.tours = {
	tourRunning: false,
	currentMeta: "", //used in team-validator (can only be a subset of metagames)
	TLMcreated: false,
	format: '', //used to fill pastTours
	isMonothreat: false,
	isLTM: false,
	autodq: false,
	autodqtime: '3',
	monothreatType: '',
	pastTours: [],
	timers: [],
	finalsMsg: false,
	onUpdate: function (tourProgress, room) {
		if (!tourProgress.bracketData || !tourProgress.bracketData.rootNode) return;
		if (tourProgress.bracketData.rootNode.state === 'inprogress' && !Tours.finalsMsg) {
			send(room + "|/wall The finals have started!");
			Tours.finalsMsg = true;
		}
	},
	onForceEnd: function() {
		send('monotype|/pm ' + config.owner + ', ' + Tours.timers.length);
		
		console.log(Tours.timers);
		for (var i=0; i<Tours.timers.length; i++) {
			clearTimeout(Tours.timers[i]);
		}
		Tours.tourRunning = false;
		Tours.isMonothreat = false;
		Tours.monothreatType = '';
		Tours.isLTM = false;
		Tours.autodq = false;
		Tours.timers = [];

		TeamValidator.onTourEnd(); //cleans up TeamValidator battles
		TeamValidator.currentMeta = '';
		return;
	},
	onStart: function(room) {
		Tours.tourRunning = true;
		Tours.finalsMsg = false;
		//throttle the commands to help with lag
		//DoWedit: is this still needed?
		setTimeout(function() {
			send(room + '|/tour autodq ' + Tours.autodqtime);
		}, 1000);
		
		if (Tours.format.indexOf('random') === -1) {
			setTimeout(function() {
				send(room + '|/tour scout off');
			}, 1500);
		}
		
		setTimeout(function() {
			send(room + '|/tour modjoin off');
		}, 2000);
		
	},
	onEnd: function(rawTourOutput, room) {
		Tours.tourRunning = false;
		Tours.TLMcreated = false;
		Tours.isMonothreat = false;
		Tours.monothreatType = '';
		Tours.isLTM = false;
		Tours.autodq = false;
		Tours.timers = [];
		
		var tourOutput = JSON.parse(rawTourOutput);
		//this.logRawOutput(rawTourOutput, tourOutput, room);
		if (tourOutput.generator !== 'Single Elimination') return; //escape from double elim tours b/c they aren't compatible with determine Top4
		var top4 = this.determineTop4(tourOutput, room);
		
		//congratulate the winners
		try {
			var text = 'Congratulations to ' + top4[0] + ' for winning the tour. 2nd: ' + top4[1] + ' 3rd: ' + top4[2] + ' and ' + top4[3];
		} catch(e) {
			console.log('Failed to congratulate top 4: ' + top4);
		}
		console.log(text);
		if (room) send(room + '|/wall ' + text);
		
		TeamValidator.onTourEnd(); //cleans up TeamValidator battles
		TeamValidator.currentMeta = '';
	},
	determineTop4: function(tourOutput, room) {
		var foo=tourOutput.bracketData.rootNode;
		var firstPlace = '';
		var secondPlace = '';
		var thirdPlace = ['', ''];
		
		if (!foo.children[1].children[1]) return; //if the tour had less than 4 people then we don't care (keeps the bot from crashing)

		var top4 = [foo.children[0].children[0].team, foo.children[0].children[1].team, foo.children[1].children[0].team, foo.children[1].children[1].team];
		var top2 = [foo.children[0].team, foo.children[1].team];
		var firstPlace = foo.team;

		// cut down top4 and top 2 arrays to only include 3rd place and 2nd place.
		var index = top2.indexOf(firstPlace);
		if (index > -1) {
			top2.splice(index, 1);
			secondPlace = top2[0];
		}
		index = top4.indexOf(firstPlace);
		if (index > -1) {
			top4.splice(index, 1);
		}
		index = top4.indexOf(secondPlace);
		if (index > -1) {
			top4.splice(index, 1);
			thirdPlace=top4;
		}
		var orderedTop4 = [firstPlace, secondPlace, thirdPlace[0], thirdPlace[1]];
		return orderedTop4;
	},
};
