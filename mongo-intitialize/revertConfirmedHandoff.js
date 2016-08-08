var mongoose = require('mongoose'),
		serverConfig = require('../server-config.json'),
		User = require('../models/User');
		users = require('../userIds.json').users,
		nodemailer = require('nodemailer'),
		smtpTransport = require('nodemailer-smtp-transport'),
		hostname =  (serverConfig.live ? "uxccds.cisco.com:": "localhost:")+serverConfig.port;
var numProcessing = 0;


mongoose.connect('mongodb://'+ serverConfig.hostName + '/' +serverConfig.database);

var mongooseTasksToProcess = 2;

User.findOne({userId: "yshiu"}, function(err, user){
	user.handoffTo = undefined;
	user.hasOSMO = true;
	user.save(function(err) {
		if(err) {
			console.log(err);

		} else {
			console.log('user updated');
		}
		mongooseTasksToProcess--;
		if(mongooseTasksToProcess == 0){
			process.exit();

		}

	})
});

User.findOne({userId: "tifok"}, function(err, user){
	user.referer = undefined;
	user.timeStart = undefined;
	user.hasOSMO = false;
	user.save(function(err) {
		if(err) {
			console.log(err);

		} else {
			console.log('user updated');
		}

		mongooseTasksToProcess--;
		if(mongooseTasksToProcess == 0){
			process.exit();

		}

	})
});


