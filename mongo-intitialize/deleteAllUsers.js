var mongoose = require('mongoose'),
		serverConfig = require('../server-config.json'),
		User = require('../models/User');
		userIds = require('../userIds.json').users;

mongoose.connect('mongodb://'+ serverConfig.hostName + '/' +serverConfig.database);

User.remove({}, function(err){
	if(err){
		console.log(err);
	}
	console.log("all users removed");
});

