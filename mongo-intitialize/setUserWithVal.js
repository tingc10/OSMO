var mongoose = require('mongoose'),
		serverConfig = require('../server-config.json'),
		User = require('../models/User');

mongoose.connect('mongodb://'+ serverConfig.hostName + '/' +serverConfig.database);

User.findOneAndUpdate({userId:"luwang2"}, {referer: "Random Selection", hasOSMO: true, timeStart: new Date()}, function(err, user){
	
	if(err) {
		console.log(err);
	}
	console.log("success");
	process.exit();
});


// function setCompleteDate(user){
// 	User.findOne({userId: user}, function(err, user){
// 		if(err){
// 			console.log('could not save...');
// 			process.exit(1);
// 		}
// 		user.uploadComplete = new Date();
// 		user.save(function(err){
// 			if(err){
// 				console.log(err);
// 				process.exit(1);
// 			}
// 			process.exit();
// 		})
// 	});
// };

// setCompleteDate('yshiu');
// setCompleteDate('viviho');
