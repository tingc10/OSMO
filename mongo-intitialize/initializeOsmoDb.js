var mongoose = require('mongoose'),
		serverConfig = require('../server-config.json'),
		User = require('../models/User');
		userIds = require('../userIds.json').users;

mongoose.connect('mongodb://'+ serverConfig.hostName + '/' +serverConfig.database);
/**
 *	Create user unconfigured user
 *	@param {string} userId to be inserted
 */
function addEmptyUser(userId){
	console.log(userId);
	var newUser = new User({
		userId : userId
	});
	// console.log(newUser);
	// newUser.createVerification(function(err, verification){
	// 	if(err) console.log(err);
	// 	// console.log("User's verification is: " + verification);
	// });
	
	newUser.save(function(err){
		if(err) {
			console.log(err);
			return;
		}
		console.log("User Created!");
	});
};

for(var i = 0, length = userIds.length; i < length; i++){
	addEmptyUser(userIds[i]);
}
var initializerId = "tingche";
User.findOne({userId: initializerId}, function(err, user){
	if(err){
		console.log("error finding "+ initializerId+"'s account", err);
	}
	user.hasOsmo = true;
	user.timeStart = new Date();
	user.save(function(err){
		if(err){
			console.log(err);
		}
		console.log(initializerId+" set as first");
	});
});
console.log('Initialization complete');

