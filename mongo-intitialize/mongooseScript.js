var mongoose = require('mongoose'),
		serverConfig = require('../server-config.json'),
		User = require('../models/User');
		users = require('../userIds.json').users,
		nodemailer = require('nodemailer'),
		smtpTransport = require('nodemailer-smtp-transport'),
		hostname =  (serverConfig.live ? "uxccds.cisco.com:": "localhost:")+serverConfig.port;
var numProcessing = 0;

var transporter = nodemailer.createTransport(smtpTransport({
    host: 'outbound.cisco.com',
    port: 25,
    auth: {
        user: 'tingche',
        pass: '4qnVYVMH4qTM'
    }
}));

mongoose.connect('mongodb://'+ serverConfig.hostName + '/' +serverConfig.database);

var categories = [];
var winners = [];
for(var i = 0; i < 5; i++){
	categories.push([]);
};
User.find({}, function(err, users){
	if(err){
		console.log(err);
	}
	// count votes
	for(var i = 0, length = users.length; i < length; i++){
		var user = users[i];
		for(var j = 0; j < user.votes.length; j++){
			var votedUser = user.votes[j];
			if(votedUser) {
				if(!categories[j][votedUser]) {
					categories[j][votedUser] = 1;
				} else {
					categories[j][votedUser]++;
				}
			}
		}
	}
	console.log("Candidates are:", categories);
	// determine winner
	for(var i = 0; i < categories.length; i++) {
		var highestVotes = [];
		var highestCount = 0;
		for(var votedUser in categories[i]) {
			var curCount = categories[i][votedUser];
			if(highestCount < curCount){
				highestVotes = [];
				highestVotes.push(votedUser);
				highestCount = curCount;
			} else if(highestCount === curCount){
				highestVotes.push(votedUser);
			}
		}
		winners.push({
			names : highestVotes,
			count : highestCount
		});
	}
	console.log("Winners are:", winners);
	process.exit();
});
