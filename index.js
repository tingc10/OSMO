var express = require('express'),
		app = express(),
		server = require('http').createServer(app),
		path = require('path'),
		logger = require('morgan'),
		cookieParser = require('cookie-parser'),
		bodyParser = require('body-parser'),
		io = require('socket.io')(server),
		Vimeo = require('vimeo').Vimeo,
		session = require('client-sessions'),
		config = require('./config.json'),
		serverConfig = require('./server-config.json'),
		hostname =  (serverConfig.live ? "uxccds.cisco.com:": "localhost:")+serverConfig.port,
		lib = new Vimeo(config.clientId,config.clientSecret, config.accessToken)
		mongoose = require('mongoose'),
		mongoose.connect('mongodb://'+serverConfig.hostName+ '/' +serverConfig.database),
		User = require('./models/User'),
		Picture = require('./models/Picture'),
		crypto = require('crypto'),
		nodemailer = require('nodemailer'),
		smtpTransport = require('nodemailer-smtp-transport'),
		multiparty = require('connect-multiparty')({uploadDir: __dirname + "/public/uploads"}),
		fs = require('fs'),
		moment = require('moment');

var runningTimeouts = {};

/*
 *	Transporter settings used to send out emails
 */
var transporter = nodemailer.createTransport(smtpTransport({
    host: 'outbound.cisco.com',
    port: 25,
    auth: {
      user: 'tingche',
      pass: '4qnVYVMH4qTM'
    }
}));

// var transporter = nodemailer.createTransport({
//   service: 'Gmail',
//   auth: {
//     user: 'tingche@cisco.com',
//     pass: 'osmocampaign'
//   }
// });


/*
 *	Delete a file within the uploads directory
 *	@params {string} path : the path to the uploads directory that's public
 *														"/uploads/*"
 */
var deleteFileInUploads = function(path){
	try {
		fs.unlink(__dirname + "/public" + path);
	} catch(err) {
		console.log("Error occured while try to delete file with path")
	}
};

/*
 *	Generate the verification email link for the particular user
 *	@param {obj} user: the User obj from collection
 */
var sendResetEmail = function(user){
	var verificationLink = "http://"+ hostname + "/reset.html#/?u="+user.userId+"&v="+user.verification;
	transporter.sendMail({
    from: 'tingche@cisco.com',
    to: serverConfig.testing ? 'tingche@cisco.com' : user.userId + '@cisco.com',
    subject: '[OSMO] Password Reset Link',
    html: "<a href='"+ verificationLink + "' target='_blank'>Your OSMO password reset link</a>" 
	}, function(error, response) {
	   console.log("Reset Email pending to " + user.userId);
	   if (error) {
	        console.log(error);
	   } else {
	        console.log('Message sent');
	   }
	});
};

/*
 *	Generate the verification email link for the particular user
 *	@param {obj} user: the User obj from collection
 */
var sendVerificationEmail = function(user){
	var verificationLink = "http://"+hostname + "/register.html#/?u="+user.userId+"&v="+user.verification;
	transporter.sendMail({
    from: 'tingche@cisco.com',
    to: serverConfig.testing ? 'tingche@cisco.com' : user.userId + '@cisco.com',
    // to: 'tingche@cisco.com',
    subject: '[OSMO] Registration Link',
    html: "<a href='"+ verificationLink + "' target='_blank'>Your OSMO registration link</a>" 
	}, function(error, response) {
	   console.log("Verification Email pending to " + user.userId);
	   if (error) {
	        console.log(error);
	   } else {
	        console.log('Message sent');
	   }
	});
};

/*
 *	Send an email to tell the user their time is up
 *	@param {obj} user: the whose time is up
 */
var sendTimesUpEmail = function(user){
	var osmoPage = "http://"+hostname + "/#/?n=main";
	transporter.sendMail({
    from: 'tingche@cisco.com',
    to: serverConfig.testing ? "tingche@cisco.com" : user.userId + '@cisco.com',
    cc: serverConfig.testing ? "" : "ddaood@cisco.com, tingche@cisco.com",
    subject: '[OSMO] Your time with OSMO is up!',
    html: "Time to submit your video!<br /><a href='"+ osmoPage+ "' target='_blank'>Login and upload!</a><br/>Also... Watch out for ninjas..." 
	}, function(error, response) {
	   console.log("Timesup Email pending to " + user.userId);
	   if (error) {
	      console.log(error);
	   } else {
	      console.log('Message sent');
	   }
	});
};

/*
 *	Send an email to tell the user their time is up
 *	@param {obj} user: the whose time is up
 */
var sendHandoffOsmoEmail = function(user){
	var osmoPage = "http://"+hostname + "/#/?n=main";
	transporter.sendMail({
    from: 'tingche@cisco.com',
    to: serverConfig.testing ? "tingche@cisco.com" : user.userId + '@cisco.com',
    cc: serverConfig.testing ? "" : "ddaood@cisco.com, tingche@cisco.com",
    subject: '[OSMO] Please Handoff the OSMO!',
    html: "We got your submission, but please handoff the OSMO!<br /><a href='"+ osmoPage+ "' target='_blank'>Login and Confirm Handoff!</a>" 
	}, function(error, response) {
	   console.log("Handoff Osmo Email pending to " + user.userId);
	   if (error) {
	      console.log(error);
	   } else {
	      console.log('Message sent');
	   }
	});
};

/*
 *	Send to whole UXCCDS new user upload
 *	@param {obj} user: User that recently uploaded
 */
var sendNewUploadEmail = function(user){
	
	var userFocusLink = "http://"+hostname + "/#/?n=main&focus="+user.userId;
	// get entire list of users to send email to
	// User.find({}, function(err, users){
	// 	if(err){
	// 		console.log("error retrieving everyone");
	// 	}
	// 	var toMass = '';
	// 	for(var i = 0, length = users.length; i < length; i++){
	// 		toMass += users[i].userId + "@cisco.com, ";
	// 	}
	// 	if (toMass != ''){
	// 		toMass = toMass.slice(0, toMass.length -2);
	// 		console.log("toMass: " + toMass);
	// 	}
	// });
	transporter.sendMail({
    from: user.userId + '@cisco.com',
    to: serverConfig.testing ? 'tingche@cisco.com' : "cctgdesignstudio@cisco.com",
    subject: '[OSMO] Check out '+(user.name ? user.name : user.userId)+"'s OSMO Video Submission!",
    html: "<a href='"+ userFocusLink + "' target='_blank'>Check out "+(user.name ? user.name : user.userId)+"'s Video Submission!</a>" 
	}, function(error, response) {
	   console.log("New Upload by " + user.userId);
	   if (error) {
        console.log(error);
	   } else {
        console.log('Message sent');

	   }
	});
};


/*
 *	Sends an email to tingche that there is something improper with the OSMO locations
 *	@param {sring} errorString: the User obj from collection
 */
var sendErrorEmail = function(errorString){
	transporter.sendMail({
    from: 'tingche@cisco.com',
    to: 'tingche@cisco.com',
    subject: '[OSMO] Error in OSMO App',
    html: errorString 
	}, function(error, response) {
	   console.log("Error Email");
	   if (error) {
        console.log(error);
	   } else {
	      console.log('Message sent');
	   }
	});
};
/*
 *	Sends a link to the user who has been selected as the next person to use the OSMO
 */
var sendHandoffEmail = function(sender, receiver){
	var dashboard = "http://"+hostname + "/dashboard";
	transporter.sendMail({
    from: sender.userId + '@cisco.com',
    to: serverConfig.testing ? "tingche@cisco.com" : receiver.userId + '@cisco.com',
    // to: "tingche@cisco.com",
    subject: "[OSMO] You've been selected!!",
    html: "OSMO is coming your way! Login or register to confirm when you have received it!<br /><a href='"+ dashboard + "' target='_blank'>OSMO Home Page</a>" 
	}, function(error, response) {
	   console.log("Handoff Osmo by " + sender.userId);
	   if (error) {
	      console.log(error);
	   } else {
	      console.log('Message sent');
	   }
	});
};


/*
 *	Returns all users and necessary info
 *	@param {function} callback
 *	@param {function} error
 */
var getAllUsers = function(callback, error) {
	User.find({},function(err, users){
		if(err){
			error(err);
		} else {
			callback(users.map(function(user){
				return user.toJSON()
			}));
		}

	});
};

/*
 *	Returns users who have any media, whether that is a selfie or thumbnails
 *	@param {function} callback
 *	@param {function} error
 */
var getUsersWithMedia = function(callback, error) {
	User.find({$or:[{videoUri: {$exists:true}}, {selfieLocation:{$exists:true}}, {thumbnailLocations:{$exists:true, $ne: []}}]},function(err, users){
		if(err){
			error(err);
		} else {
			callback(users.map(function(user){
				return user.toJSON()}
				));
		}

	});
};




/*
 *	Get the user then run callback on user object. 
 *	Automatically send 400 is error
 *	@param {string} userId
 *	@param {function} callback : callback if user found
 *	@require {model} User  
 */
var getUserByUserId = function(userId, res, callback){
	User.findOne({userId: userId}, function(err, user){
		if(err){
			res.status(400).send(err);
		} else {
			// console.log(user[0]);
			if(user) {
				callback(user);
			} else {
				res.status(200).send("No matching username");
			}
		}
	});
};

/*
 *	Apply to requests that are private, returns user back to main page
 */
function requireLogin (req, res, next) {
  if (!req.user) {
  	console.log("user was not logged in");
    res.redirect('/');
  } else {
    next();
  }
};

/*
 *	Checks the returned list of users who have the OSMO, check that no region has more than one
 *	@params {obj} users : list of all users who have the OSMO
 */
function sortOsmoLocations(users){
	var osmoLocations = {};
	var duplicateUsers = [];
	for(var i = 0, length = users.length; i < length; i++){
		switch(users[i].location){
			case "SJ":
				if(!osmoLocations["SJ"]){
					osmoLocations["SJ"] = users[i];
				} else if(!osmoLocations["SJ2"]) {
					osmoLocations["SJ2"] = users[i];
				} else {
					duplicateUsers.push(users[i]);
				}
				
				break;
			case "SF":
				if(!osmoLocations["SF"]){
					osmoLocations["SF"] = users[i];
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
		var string = '';
		for(var i = 0, length = duplicateUsers.length; i < length; i++){
			string += duplicateUsers[i].userId + " ";
		}
		string += "is a duplicate user who has an OSMO...";
		sendErrorEmail(string);
	}
	return osmoLocations;
};


/*
 *	Gets all the users that can receive the OSMO in your location
 *	@params {string} location : the user's current location
 *	@return {obj}	locationFilter : JSON object for locating users in location
 */
var usersInSimilarLocation = function(location) {
	var locationFilter;
	switch(location){
		case "SJ":
			locationFilter = {
				"location": "SJ"
			};
			break;
		case "SF":
			locationFilter = {
				"location": "SF"
			};
			break;
		case "TX":
		case "SEATTLE":
		case "OREGON":
		case "SD":
			locationFilter = {
				$or: [
					{"location": "TX"},
					{"location": "SEATTLE"},
					{"location": "OREGON"},
					{"location": "SD"}
				]
			};
			break;
		case "GALWAY":
		case "DUBLIN":
		case "OSLO":
			locationFilter = {
				$or: [
					{"location": "GALWAY"},
					{"location": "DUBLIN"},
					{"location": "OSLO"}
				]
			};
			break;
		case "SHANGHAI":
		case "KOREA":
			locationFilter = {
				$or: [
					{"location": "SHANGHAI"},
					{"location": "KOREA"}
				]
			};
			break;
	}
	return locationFilter;
};



/*
 *	Set the current session to the user
 *	@param {obj} user: User model object
 */
var setSession = function(req, user){
	req.session.user = user;
	req.user = user;
}

/*
 * Check users who have the Osmo and starts the timer if the app crashes
 */
var appInit = (function(){
	User.find({hasOSMO: true}, function(err, users){
		if(err){
			console.log("Error finding users with the Osmo");

		}
		var osmoLocations = sortOsmoLocations(users);
		
		var twoDays = moment.duration(48, "hours");
		var oneDay = moment.duration(24, "hours");
		for(var i = 0, length = users.length; i < length; i++){
			var user = users[i],
					elapsedTime = moment().diff(moment(user.timeStart)),
					durationElapsed = moment.duration(elapsedTime);
					
			if(user.uploadComplete) {
				// if the user has the OSMO and has already uploaded, remind them to hand it off
				var timeLeft = moment.duration(oneDay).subtract(durationElapsed);
				console.log((user.name ? user.name : user.userId) + " has " + timeLeft.asMilliseconds() + " milliseconds left to hand off.");
				if(timeLeft.asMilliseconds() > 0){
					(function(user){
						runningTimeouts[user.userId] = {
							handoffTimer : setTimeout(function(){
								sendHandoffOsmoEmail(user);
								delete runningTimeouts[user.userId].handoffTimer;
							}, serverConfig.testing ? 5*1000 : timeLeft.asMilliseconds())
							// }, 60*1000)
						};
					})(user);
					
				} else {
					(function(user){
						sendHandoffOsmoEmail(user);
					})(user);
					
				}
				
			} else {
				// set the settimeout
				var timeLeft = moment.duration(twoDays).subtract(durationElapsed);
				console.log((user.name ? user.name : user.userId) + " has " + timeLeft.asMilliseconds() + " milliseconds left with OSMO.");
				if(timeLeft.asMilliseconds() > 0){
					(function(user){
						runningTimeouts[user.userId] = {
							timesUp : setTimeout(function(){
								
								sendTimesUpEmail(user);
								delete runningTimeouts[user.userId].timesUp;
							}, serverConfig.testing ? 5*1000 : timeLeft.asMilliseconds())
							// }, 60*1000)
						};
					})(user);
						
				} else {
					(function(user){
						sendTimesUpEmail(user);
					})(user);
					
				}
			}
		}
	});
}());


// app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(cookieParser());
app.set('port', process.env.PORT || serverConfig.port);
app.use(express.static(__dirname + "/public"));
app.use(session({
  cookieName: 'session',
  secret: crypto.randomBytes(64).toString('hex'),
  duration: 2 * 60 * 60 * 1000, // keep session live for 2 hours
  activeDuration: 5 * 60 * 1000,
}));
/*
 * Set user session and make it available in cookies, also remove password and verification
 */
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Origin");
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");

  if (req.session && req.session.user) {
  	getUserByUserId(req.session.user.userId, res, function(user){
  		if (user) {
  			// user = ;
  			
  			req.user = user.toJSON();
        req.session.user = user;  //refresh the session value
        res.locals.user = user;
      }
      // finishing processing the middleware and run the route
      next();
  	});
  } else {
    next();
  }
});

app.get('/dashboard/videos/:videoId', requireLogin, function(req, res){
	var videoId = req.params.videoId ? "&userId="+req.user.userId+"&videoId="+req.params.videoId : "";
	// should only get here if session accepted 
	res.redirect("/#?n=dashboard" + videoId);
});

app.get('/dashboard', requireLogin, function(req, res){
	res.redirect("/#?n=dashboard");
});


app.get('/logout', function(req, res){
	req.session.reset();
	res.status(200).send("logged out");
});
/*
 *	Handle upload complete and save URI
 */
app.get('/saveUpload', function(req, res){
	var videoUri = req.query.video_uri;
	res.redirect('/dashboard'+videoUri);
});

app.post('/login', function(req, res){
	var data = req.body;
			userId = data.userId,
			password = data.password;
	getUserByUserId(userId, res, function(user){
		if(user.password == password) {
			setSession(req, user);

			res.status(200).send({msg:'Session saved', user: user.toJSON()});
		} else if(!user.password) {
			res.status(200).send('unregistered');
		} else {
			res.status(200).send('Incorrect Password');
		}
	});
})
/*
 *	Checks session
 */
app.get('/currentUser', function(req, res){
	if(!req.user) {
		res.status(200).send({msg:"Not Logged In..."});
	} else {
		res.status(200).send({msg:"Logged In", user: req.user});

	}
});
/*
 *	Just resend verification link
 */
app.get('/reset/user/:userId', function(req, res){
	var userId = req.params.userId;
	getUserByUserId(userId, res, function(user){
		sendResetEmail(user);
		res.status(200).send("sent out mail");		
		
	});
});
/**
 *	Check to see if user is already registered,
 *	if not registered return in response unregistered flag
 */
app.get('/register/user/:userId', function(req, res){
	var userId = req.params.userId;
	getUserByUserId(userId, res, function(user){
		if(!user.password){
			sendVerificationEmail(user);
			res.status(200).send("unregistered");
		} else {
			res.status(200).send("registered");
		}
	});
});
/*
 *	Check if the verification matches the user, if so, proceed with registration
 */
 app.get('/register/user/:userId/:verification', function(req, res){
	var userId = req.params.userId;
	var verification = req.params.verification;
	getUserByUserId(userId, res, function(user){
		// console.log(user.verification);
		if(user.verification == verification){
			res.status(200).send("verified");

		} else {
			res.status(200).send("unverified");

		}
	});
});

/*
 *	Get video from vimeo
 */
app.get('/video/:videoId', function(req, res){
	var videoId = req.params.videoId;
	lib.request({
      // This is the path for the videos contained within the staff picks channels
      method: 'GET',
      path : '/me/videos/'+ videoId
  }, function (error, body, statusCode, headers) {
      if (error) {
          console.log(error);
          res.status(400).send(error);
      } else {
          // console.log('body');
          // console.log(body);
          res.status(200).send(body);
      }
  });
});
app.post('/video', requireLogin, function(req, res){
	var videoId = req.body.videoId;
	var userId = req.body.userId;
	// console.log(req.body);
	if(req.user.userId == userId){
		if(videoId){
			getUserByUserId(req.user.userId, res, function(user){
				user.videoUri = "/videos/"+ videoId;
				user.uploadComplete = new Date();
				user.save(function(err){
					if(err){
						console.log("Could not save video uri: " + err);
						res.status(400).send(err);
					}
					if(runningTimeouts[user.userId] && runningTimeouts[user.userId].timesUp){
						clearTimeout(runningTimeouts[user.userId].timesUp);
						delete runningTimeouts[user.userId].timesUp;
					}
					console.log('setting handoff timer');
					runningTimeouts[user.userId] = {
						handoffTimer : setTimeout(function(){
							sendHandoffOsmoEmail(user);
							delete runningTimeouts[user.userId].handoffTimer;
						}, serverConfig.testing ? 60*1000 : 86400000)
						// }, 60*1000)
					};
					sendNewUploadEmail(user);
					res.status(200).send("videoUri saved");
				});
			});
		};
	} else {
		res.status(400).send('Session user does not match');
	}
	
});

/*
 *	Start the recipient's timeStart and hand off the OSMO. Starts setTimeout to 48 hours
 */
app.post('/osmo/db/confirmHandoff', requireLogin, function(req, res){
	var recipientId = req.body.recipient;
	var senderId = req.body.sender;
	getUserByUserId(recipientId, res, function(recipient){
		recipient.timeStart = new Date();
		recipient.hasOSMO = true;
		
		recipient.save(function(err){
			if(err) {
				res.status(400).send({msg:"problem saving...", error: err});
			}
			runningTimeouts[recipient.userId] = {
				timesUp : setTimeout(function(){
					sendTimesUpEmail(recipient);
					delete runningTimeouts[recipient.userId].timesUp;
				}, serverConfig.testing ? 60*1000 : 172800000)
				// }, 60*1000)
			};

			getUserByUserId(senderId, res, function(sender){
				sender.hasOSMO = false;
				sender.save(function(err){
					if(err){
						res.status(200).send({msg:'OSMO handed off but update who has OSMO', error: err});
					}
					if(runningTimeouts[sender.userId] && runningTimeouts[sender.userId].handoffTimer) {
						clearTimeout(runningTimeouts[sender.userId].handoffTimer);
						delete runningTimeouts[sender.userId].handoffTimer;
					}
					
					res.status(200).send({msg:"Successful confirmation"});
				});
			});
		});
	});
});

/*
 *	Set new user to hold osmo and send email to them
 */
app.post('/osmo/db/refer', requireLogin, function(req, res){
	var recipientId = req.body.recipientId;
	if(!req.user.hasOSMO){
		console.log(req.user.userId + " does not have the osmo??")
	}
	User.find({$or:[{userId:req.user.userId}, {userId: recipientId}]}, function(err, users){
		if(err){
			res.status(400).send({msg: "error", error: err});
		}
		var currentUser, recipientUser;
		if(users[0].userId == req.user.userId){
			currentUser = users[0];
			recipientUser = users[1];
		} else {
			currentUser = users[1];
			recipientUser = users[0];
		}
		currentUser.handoffTo = recipientUser.userId;
		
		currentUser.save(function(err){
			if(err){
				console.log({msg: "error: could not save handoff", error: err});
				res.status(400).send({msg: "error: could not save handoff", error: err});
			}
			recipientUser.referer = currentUser.userId;
			recipientUser.save(function(err){
				if(err){
					console.log({msg:"error: saved handoff but not referer", error: err});
					res.status(400).send({msg:"error: saved handoff but not referer", error: err});

				}
				sendHandoffEmail(currentUser, recipientUser);
				res.status(200).send({msg:"success: next user selected"});
			});
		});


	});
});

/*
 *	Get all users with OSMO
 */
app.get('/osmo/db/users/hasOSMO', function(req, res){
	User.find({hasOSMO: true}, 'userId location timeStart handoffTo', function(err, users){
		if(err){
			res.status(400).send({msg:"error", error: err});

		}
		var osmoLocations = sortOsmoLocations(users);
		// get all users to get the name
		User.find({}, function(err, users){
			if(err) {
				console.log('Error occured getting all users');
				res.status(400).send({msg:"error", error: err});
			}
			var getNameFromId = function(userId){
				if(!users) {
					console.log('no info about all users');
					return;
				}
				for(var i = 0, length = users.length; i < length; i ++){
					if(users[i].userId == userId) {
						return (users[i].name ? users[i].name : userId);
					}
				}
				console.log("could not find user with ID: " + userId);
			};
			for(var location in osmoLocations){
				osmoLocations[location].userId = getNameFromId(osmoLocations[location].userId);
				if(osmoLocations[location].handoffTo) {
					osmoLocations[location].handoffTo = getNameFromId(osmoLocations[location].handoffTo);
				}
			}
			res.status(200).send({msg:"success", users: osmoLocations});
		});
		
	});
});

/*
 *	Get all users that matches a specific filter
 */
app.get('/osmo/db/users/:filter', function(req, res){
	var filter = req.params.filter;
	// console.log(filter);
	if(filter == "hasnotupload"){
		if(!req.user){
			res.status(400).send('You must be logged in to get users who have not uploaded');
		}
		var locationFilter = usersInSimilarLocation(req.user.location);
		var hasNotUpload = {uploadComplete: {$exists:false}};
		var noOSMO = {$or: [{hasOSMO: false}, {hasOSMO: {$exists: false}}]};
		User.find({$and:[locationFilter, hasNotUpload, noOSMO]}, 'userId location').sort({location:-1}).exec(function(err, users){
			if(err){
				res.status(400).send({msg:"Error", error: err});
			}

			res.status(200).send({msg:"success", users: users})

		});
	} else if (filter == "media") { 
		// Get all users with media
		getUsersWithMedia(function(usersJSON){
			res.status(200).send(usersJSON);
		}, function(err){
			res.status(400).send('could not retrieve users with media');
		});
	} else {
		// get all users by default
		getAllUsers(function(usersJSON){
			res.status(200).send(usersJSON);
		}, function(err){
			res.status(400).send('could not retrieve all users');

		});
	}
});
/*
 *	Updates a user's thumbnails
 */
app.post('/osmo/db/:userId/vimeoThumbnail', function(req, res) {
	// console.log('hi');
	var updateParams = req.body;
	var userId = req.params.userId;
	console.log(userId, updateParams);
	getUserByUserId(userId, res, function(user){
		user.vimeoThumbnail = updateParams.vimeoThumbnail;
		user.save(function(err){
			if(err){
				res.status(400).send({msg:"error occured on update", error: err});
			}
			res.status(200).send({msg: "update success", response: user});
		});
	});
	
});
// app.get('/osmo/db/users/:userId', function(req, res){

// });

/**
 *	Get all users
 */	
app.get('/osmo/db/users', function(req, res){
	User.find({}, function(err, users){
		
		if(err) {
			res.status(400).send('could not retrieve users');
		}
		var usersAsJSON = users.map(function(user){
			return user.toJSON();
		});
		res.status(200).send(usersAsJSON);
	});
});

/*
 *	"Create" user. Or more specifically apply a password 
 *	Cache Session after completion
 */
app.post('/osmo/db/users', function(req, res) {
	var data = req.body,
			userId = data.userId,
			password = data.password,
			name = data.name;
	getUserByUserId(userId, res, function(user){
		user.name = name;
		user.password = password;
		user.save(function(err){
			if(err){
				console.log("Error saving password:" + err);
				res.status(400).send("Could not save password...");
			}
			console.log(name+' ('+userId+")"+' has successfully create their account.');
			// save user session when account is created
			setSession(req, user);
			res.status(200).send("user created");
		})

	});
});

/*
 *	Update password/ reset pasword link
 *	Cache Session after completion
 */
app.put('/osmo/db/users', function(req, res) {
	var data = req.body,
			userId = data.userId,
			password = data.password;
	User.findOneAndUpdate({userId: userId}, {password: password}, {new: true}, function(err, user){
		if(err) {
			console.log("Error updating password:" + err);
			res.status(400).send({msg: "Could not update password...", error: err});
		}
		console.log(userId+' has successfully updated their password.');
		// save user session when account is created
		setSession(req, user);
		res.status(200).send("success");
	});
	
});

/*
 *	Update password/ reset pasword link
 *	Cache Session after completion
 */
app.put('/osmo/db/users/name', requireLogin, function(req, res) {
	var data = req.body,
			name = data.name;
	User.findOneAndUpdate({userId: req.user.userId}, {name: name}, {new: true}, function(err, user){
		if(err) {
			console.log("Error updating name:" + err);
			res.status(400).send({msg: "Could not update name...", error: err});
		}
		console.log(user.userId+' has successfully updated their name.');
		res.status(200).send("success");
	});
	
});

/*
 *	Update votes
 *	Cache Session after completion
 */
app.put('/osmo/db/users/votes', requireLogin, function(req, res) {
	var data = req.body,
			newVotes = data.votes;

	User.findOneAndUpdate({userId: req.user.userId}, {votes: newVotes}, {new: true}, function(err, user){
		if(err) {
			console.log("Error updating votes:" + err);
			res.status(400).send({msg: "Could not update votes...", error: err});
		}
		console.log(user.userId+' has successfully updated their votes.');
		res.status(200).send("success");
	});
	
});

app.post('/uploads/:user/selfie', multiparty, function(req, res) {
  // We are able to access req.files.file thanks to 
  // the multiparty middleware
  
  if(req.user){
  	var file = req.files.file;
		var fileLocation = file.path.replace(__dirname+"/public", "");
		
	  getUserByUserId(req.user.userId, res, function(user){
	  	if(user.selfieLocation) {
	  		// if there is an existing selfie, delete it
	  		deleteFileInUploads(user.selfieLocation);
	  	}
	  	user.selfieLocation = fileLocation;
	  	user.save(function(err){
	  		if(err){
	  			res.status(400).send(err);
	  		}
	  		res.status(200).send({msg:"upload complete", fileLocation: fileLocation});
	  	});
	  });
  } else {
  	// delete file
  	console.log("no session found, improper upload, should delete");
  	deleteFileInUploads(file.path);
  }
  
});

// app.use(function(req, res, next) {
// 	console.log('handling..');
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });

io.on('connection', function(clientSocket) {
	clientSocket.on('getUploadForm', function(){
		lib.request({
        // This is the path for the videos contained within the staff picks channels
        method: 'POST',
        path : '/me/videos',
        query : {
        	'redirect_url' : hostname + "/saveUpload"
        }
    }, function (error, body, statusCode, headers) {
        if (error) {
          // console.log('error');
          // console.log(error);
          clientSocket.emit('uploadFormCallback', {status: statusCode, response: error});
        } else {
          // console.log('body');
          // console.log(body);
          clientSocket.emit('uploadFormCallback', {status: statusCode, response: body});

        }
    });
	});
});



server.listen(app.get('port'), function(){
	console.log('Osmo Server Running on Port ' + app.get('port'));
});