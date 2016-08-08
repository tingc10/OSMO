var mongoose = require('mongoose'),
		serverConfig = require('../server-config.json'),
		User = require('../models/User');
		users = require('../userIds.json').users,
		hostname =  (serverConfig.live ? "uxccds.cisco.com:": "localhost:")+serverConfig.port,
		moment = require('moment');
var totalTime = moment.duration(48, "hours");

mongoose.connect('mongodb://'+ serverConfig.hostName + '/' +serverConfig.database);
User.find({hasOSMO:true}, function(err, users){
	if(err) {
		console.log(err);
		process.exit(1);
	}
	
	for(var i = 0, length = users.length; i < length; i++) {
		var user = users[i];
		var elapsedTime = moment().diff(moment(user.timeStart)),
				durationElapsed = moment.duration(elapsedTime),
				timeLeft = moment.duration(totalTime).subtract(durationElapsed),
				hoursLeft = Math.floor(timeLeft.asHours()),
				minutesLeft = timeLeft.minutes(),
				secondsLeft = timeLeft.seconds();
		// console.log(user);
  	console.log((user.name ? user.name : user.userId) + " has " + hoursLeft + ":" + minutesLeft + ":" + secondsLeft + " left");
	}
	process.exit();
});