exports.OMmmc = {
    isOfficial: false,
    pastTours: [],
    metaList: ['aaa', 'uu', 'lc', 'doubles', 'bw'],
    nextMeta: '',
    onEnd: function(rawTourOutput, room) {
        var tourOutput = JSON.parse(rawTourOutput);
       
        var top4 = Tours.determineTop4(tourOutput, room);
        
		//update standings 
		if (OMMMC.isOfficial) {
        	this.addTourToGoogleSheet(top4, this.nextMeta);
			
			//randomly pick the next OM
			var lastMeta = this.nextMeta;
			this.nextMeta = this.metaList[Math.floor(Math.random() * this.metaList.length)];
			
			//don't play the same meta twice in a row
			while (lastMeta === this.nextMeta) {
				this.nextMeta = this.metaList[Math.floor(Math.random() * this.metaList.length)];
				console.log('picked a new meta b/c the same metagame would be played twice in a row');
			}
			
			//announce the next format
			send('monotype|/wall The next format in the OM Monthly Championship will be ' + this.nextMeta);
			console.log('The next format in the OM Monthly Championship will be ' + this.nextMeta)
			OMMMC.isOfficial = false;
		}
    },
	addTourToGoogleSheet: function(top4, metagame) {
		if (typeof window === 'undefined') { // Running in NodeJS
			var domino = require('domino');
			var $ = require('jquery')(domino.createWindow());
			var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
			$.support.cors = true;
			$.ajaxSettings.xhr = function() {return new XMLHttpRequest();};
			
			var request;
			request = $.ajax({
			    url: "https://script.google.com/macros/s/AKfycbzPUc52ARjAtHfZ5NhmZKEVNIa243YOw-cPsLiu5zTp_9vltuuy/exec",
			    type: "post",
			    data: {
			    	"Metagame": metagame,
			    	"First Place": top4[0],//toId(top4[0]),
			    	"Second Place": top4[1],//toId(top4[1]),
			    	"Third Place1": top4[2],//toId(top4[2]),
			    	"Third Place2": top4[3],//toId(top4[3])
			    }
			});
			
			// Callback handler that will be called on success
			request.done(function(response, textStatus, jqXHR) {
			    // Log a message to the console
			    // console.log("Hooray, it worked!");
			});
			
			// Callback handler that will be called on failure
			request.fail(function(jqXHR, textStatus, errorThrown) {
			    // Log the error to the console
			    // console.error(
			    //     "The following error occurred: "+
			    //     textStatus, errorThrown
			    // );
			});
		}
	},
	padToLength: function(name, finalLength) {
	    var amtOfPadding = finalLength - name.length;
	    for (var i = 0; i < Math.floor(amtOfPadding / 2); i++) {
	        name = ' ' + name + ' ';
	    }
	    if (amtOfPadding % 2 === 1) {
	        name = ' ' + name;
	    }
	    return name;
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
	
};