exports.html = {
    cc: {},
    initializeCC: function() {
        var fs = require('fs');
        var foo;
        try {
    	    foo = JSON.parse(fs.readFileSync('ccInfo.json'));
    	    HTML.cc = foo;
    	    console.log('loaded old core challenges:');
        } catch (e) {} // file doesn't exist [yet]
    },
    tbc: {},
    initializeTBC: function() {
        var fs = require('fs');
        var foo;
        try {
    	    foo = JSON.parse(fs.readFileSync('tbcInfo.json'));
    	    HTML.tbc = foo; // Was HTML.cc before.
    	    console.log('loaded team building competition:');
        } catch (e) {} // file doesn't exist [yet]
    },
}