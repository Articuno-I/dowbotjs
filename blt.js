//things to change to start event
// season: 1
// isOfficial: false
// clear old tour log for season 0;
exports.blt = {
    season: 3,
    week: 1,
    tourLog: {},
    isOfficial: false,
    nextMeta: "monotype",
    metas:{
        "0": {"monotype":0, "ltm":0, "uu":0},
        "1": {"monotype":0, "cap":0, "ubers":0, "lc":0, "ltm":0, "dpp":0 },
        "2": {"gen6":0, "monotype":0, "bw":0 },
        "3": {"gen6":0, "monotype":0, "aaa":0, "ubers":0, "lc":0},
    },
    newMetasList: ['monotype', 'gen6', 'aaa', 'lc'],
    onUpdate: function(tourProgress, room) {
        return;
    },
    onForceEnd: function(tourProgess, room) {
        return;
    },
    onStart: function(room) {
        return;
    },
    onEnd: function(rawTourOutput, room) {
        this.isOfficial = false;
        return;

        //remainder of this fn is old stuff that I prefer having elsewhere

        var tourOutput = JSON.parse(rawTourOutput);
        
        var top4 = Tours.determineTop4(tourOutput, room);
		
		this.addTourToLog(top4);
		//this.updatePlayerDatabase(top4);
		//randomly pick the next OM
		var lastMeta = this.nextMeta;
		var metaList = Object.keys(this.metas[this.season])
		this.nextMeta = metaList[Math.floor(Math.random() * metaList.length)];
		
		//don't play the same meta twice in a row
		while (lastMeta === this.nextMeta) {
			this.nextMeta = metaList[Math.floor(Math.random() * metaList.length)];
			console.log('picked a new meta b/c the same metagame would be played twice in a row')
		}
		
		//announce the next format
		//send('monotype|/wall The next format in the Monotype BLT will be ' + this.nextMeta);
		console.log('The next format in the Monotype BLT will be ' + this.nextMeta)
		this.isOfficial = false;
    },
    addTourToLog: function(top4) {
        var today = new Date();
        var dd = today.getUTCDate();
        var mm = today.getUTCMonth()+1; //January is 0!
        var yyyy = today.getUTCFullYear();
        var hh = today.getUTCHours();
        var min = today.getUTCMinutes();
        
        if (dd < 10) dd = '0' + dd;
        if (mm < 10)  mm = '0' + mm;
        if (hh < 10) hh = '0' + hh;
        if (min < 10) min = '0' + min;
        
        today = dd+'/'+mm+'/'+yyyy + " " + hh + ":" + min;
        if (!BLT.tourLog[BLT.season]) BLT.tourLog[BLT.season] = {};
        if (!BLT.tourLog[BLT.season][BLT.week]) BLT.tourLog[BLT.season][BLT.week] = [];
        BLT.tourLog[BLT.season][BLT.week].unshift({
            "date": today,
            "metagame": BLT.nextMeta, //this code runs before the new meta is picked
            "top4": top4,
        });
        
        var tempBLT = {
            "season": BLT.season,
            "week": BLT.week,
            "metas": BLT.metas,
            "tourLog": BLT.tourLog,
        };
        var fs = require('fs');
		fs.writeFile("BLT.json", JSON.stringify(tempBLT), function(err) {
    		if (err) {
	    		send('monotype|/pm deathonwings, error adding this tour to the log. Please let dow know about this error.');
        		return console.log(err);
    		}
    		BLT.updateSite();
		});
    },
    updateSite: function() {
        var sys = require('sys');
        var exec = require('child_process').exec;
        function puts(error, stdout, stderr) { sys.puts(stdout); }
        //exec("~/thelordmonotyke/copyJSON.sh", puts);
    },
    initiate:function() {
        var fs = require('fs');
        var foo;
        try {
    	    foo = JSON.parse(fs.readFileSync('BLT.json'));
    	    BLT.tourLog = foo.tourLog;
    	    BLT.season = foo.season;
    	    BLT.week = foo.week;
    	    console.log('loaded BLT info: ');
    	    console.log('season: ' + BLT.season);
    	    console.log('week: ' + BLT.week);
    	    console.log('Tour Log: ' + BLT.tourLog);
        } catch (e) { 
            console.log(e); // file doesn't exist [yet]
        }
    },
};

