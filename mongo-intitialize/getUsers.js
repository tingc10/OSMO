var mongoose = require('mongoose'),
		serverConfig = require('../server-config.json'),
		User = require('../models/User');

mongoose.connect('mongodb://'+ serverConfig.hostName + '/' +serverConfig.database);


// User.find({}, function(err, users) {
//   if (err) return console.error(err);
// 	var jsonUsers = users.map(function(user){
// 		return user.toJSON();
// 	});
// 	console.log(jsonUsers);
// });

// var getUsersWithMedia = function(callback, error) {
// 	User.find({$or:[{selfieLocation:{$exists:true}}, {thumbnailLocations:{$exists:true, $ne: []}}]},function(err, users){
// 		if(err){
// 			error(err);
// 		} else {
// 			callback(users);
// 		}

// 	});
// };
// getUsersWithMedia(function(users){
// 	console.log(users);
// }, function(err){
// 	console.log(err);
// });
User.findOne({userId: "tingche"}, function(err, user){
	if(err){
		console.log("error");
	}
	console.log(user);
});