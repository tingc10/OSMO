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
		
		if(err) {
			console.log("Failed to save " + userId + ":" + err);
			
			if(numProcessing == 0) {
				process.exit(1);
			}
		}
		console.log(userId + " Created!");
		if(numProcessing == 0) {
			process.exit();
		}

	});
};

addEmptyUser({userId: "adelwang", location: "SF"});

