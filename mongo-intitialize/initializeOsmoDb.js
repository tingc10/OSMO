var mongoose = require('mongoose'),
		serverConfig = require('../server-config.json'),
		User = require('../models/User');
		users = require('../userIds.json').users;
var numProcessing = 0;

mongoose.connect('mongodb://'+ serverConfig.hostName + '/' +serverConfig.database);
/**
 *	Create user unconfigured user
 *	@param {string} userId to be inserted
 */
function addEmptyUser(user){
	var userId = user.userId;
	var location = user.location;
	var newUser = new User({
		userId : userId,
		location : location
	});
	numProcessing++;

	
	newUser.save(function(err){
		numProcessing--;
		if(numProcessing == 0) {
			setInitialUser();
		}
		if(err) {
			console.log("Failed to save " + userId + ":" + err);
			return;
		}
		console.log(userId + " Created!");

	});
};

function setInitialUser() {
	var initializerId = "tingche";
	User.findOne({userId: initializerId}, function(err, user){
		
		if(err){
			console.log("error finding "+ initializerId + "'s account", err);
			console.log("Initialization Complete");
			process.exit();
			return;
		}
		user.hasOSMO = true;
		user.timeStart = new Date();
		user.save(function(err){
			if(err){
				console.log("could not save initial user:" + err);
				console.log("Initialization Complete");
				process.exit();
			}
			console.log(initializerId+" set as first");
			console.log("Initialization Complete");
			process.exit();
		});
	});
}

for(var i = 0, length = users.length; i < length; i++){
	addEmptyUser(users[i]);
}

