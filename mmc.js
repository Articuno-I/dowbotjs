exports.mmc = {
    isOfficial: false,
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
        var tourOutput = JSON.parse(rawTourOutput);
        //this.logRawOutput(rawTourOutput, tourOutput, room);
        
        var top4 = Tours.determineTop4(tourOutput, room);
        
		//we only care about scoring standard monotype tours
        if (tourOutput.format !== 'monotype') return;
		if (tourOutput.generator !== 'Single Elimination') return;
		
		this.addTourToGoogleSheet(top4);
		
		this.isOfficial = false;
		
    },
	addTourToGoogleSheet: function(top4) {
		if (typeof window === 'undefined') { // Running in NodeJS
			var domino = require('domino');
			var $ = require('jquery')(domino.createWindow());
			var XMLHttpRequest=require('xmlhttprequest').XMLHttpRequest;
			$.support.cors = true;
			$.ajaxSettings.xhr = function() {return new XMLHttpRequest();};
			
			var request;
			request = $.ajax({
			    url: "https://script.google.com/macros/s/AKfycbynX99TA3nQjLFcZb2RM2ieoZgeRYKIr0iVsFX74wc-pGsbNWQ/exec",
			    type: "post",
			    data: {
			    	"First Place": top4[0], //toId(top4[0]),
			    	"Second Place": top4[1], //toId(top4[1]),
			    	"Third Place1": top4[2], //toId(top4[2]),
			    	"Third Place2": top4[3], //toId(top4[3])
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