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
// User.findOne({userId: "tingche"}, function(err, user){
// 	if(err){
// 		console.log("error");
// 	}
// 	console.log(user);
// });
var usersInSimilarLocation = function(location) {
	var locationFilter;
	switch(location){
		case "SJ":
		case "SF":
		case "SF":
			locationFilter = {
				$or: [
					{location: "SF"},
					{location: "SJ"},
					{location: "SD"}
				]
			};
			break;
		case "TX":
		case "SEATTLE":
		case "OREGON":
			locationFilter = {
				$or: [
					{location: "TX"},
					{location: "SEATTLE"},
					{location: "OREGON"}
				]
			};
			break;
		case "GALWAY":
		case "DUBLIN":
		case "OSLO":
			locationFilter = {
				$or: [
					{location: "GALWAY"},
					{location: "DUBLIN"},
					{location: "OSLO"}
				]
			};
			break;
		case "SHANGHAI":
		case "KOREA":
			locationFilter = {
				$or: [
					{location: "SHANGHAI"},
					{location: "KOREA"}
				]
			};
			break;
	}
	// console.log(locationFilter);
	return locationFilter;
};
/*
 *	Checks the returned list of users who have the OSMO, check that no region has more than one
 */
function sortOsmoLocations(users){
	var osmoLocations = {};
	var duplicateUsers = [];
	for(var i = 0, length = users.length; i < length; i++){
		switch(users[i].location){
			case "SJ":
			case "SF":
			case "SF":
				if(!osmoLocations["CA"]){
					osmoLocations["CA"] = users[i];
				} else {
					duplicateUsers.push(users[i]);
				}
				
				break;
			case "TX":
			case "SEATTLE":
			case "OREGON":
				if(!osmoLocations["USA"]){
					osmoLocations["USA"] = users[i];
				} else {
					duplicateUsers.push(users[i]);
				}
				break;
			case "GALWAY":
			case "DUBLIN":
			case "OSLO":
				if(!osmoLocations["EU"]){
					osmoLocations["EU"] = users[i];
				} else {
					duplicateUsers.push(users[i]);
				}
				break;
			case "SHANGHAI":
			case "KOREA":
				if(!osmoLocations["ASIA"]){
					osmoLocations["ASIA"] = users[i];
				} else {
					duplicateUsers.push(users[i]);
				}
				break;
		}
	}
	if(duplicateUsers.length > 0){
		console.log(duplicateUsers);
	}
	return osmoLocations;
};


User.find({hasOSMO: true}, function(err, users){
	if(err){
		console.log("could not get users...");
		process.exit();

	}
	var osmoLocations = sortOsmoLocations(users);
	console.log(osmoLocations);
	process.exit();

});