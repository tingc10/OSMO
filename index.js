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
		fs = require('fs');
/*
 *	Transporter settings used to send out emails
 */
var transporter = nodemailer.createTransport(smtpTransport({
    host: 'outbound.cisco.com',
    port: 25,
    auth: {
        user: 'tingche',
        pass: 'zW23FXdwr8o2'
    }
}));


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
var sendVerificationEmail = function(user){
	var verificationLink = "http://"+hostname + "/register.html#/?u="+user.userId+"&v="+user.verification;
	transporter.sendMail({
    from: 'tingche@cisco.com',
    // to: user.userId + '@cisco.com',
    to: 'tingshen.chen@gmail.com',
    subject: '[OSMO] Registration Link',
    html: "<a href='"+ verificationLink + "' target='_blank'>Your OSMO registration link</a>" 
	}, function(error, response) {
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
    // from: sender.userId + '@cisco.com',
    // to: user.userId + '@cisco.com',
    from: 'tingche@cisco.com',
    to: 'tingche@cisco.com',
    subject: '[OSMO] Registration Link',
    html: "OSMO is coming your way! Login or register to confirm when you have received it!<br /><a href='"+ dashboard + "' target='_blank'>Your OSMO registration link</a>" 
	}, function(error, response) {
	   if (error) {
	        console.log(error);
	   } else {
	        console.log('Message sent');
	   }
	});
};

/*
 *	Returns users who have any media, whether that is a selfie or thumbnails
 */
var getUsersWithMedia = function(callback, error) {
	User.find({$or:[{videoUri: {$exists:true}}, {selfieLocation:{$exists:true}}, {thumbnailLocations:{$exists:true, $ne: []}}]},function(err, users){
		if(err){
			error(err);
		} else {
			callback(users.map(function(user){return user.toJSON()}));
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
    res.redirect('/');
  } else {
    next();
  }
};




/*
 *	Set the current session to the user
 *	@param {obj} user: User model object
 */
var setSession = function(req, user){
	req.session.user = user;

}


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
  duration: 30 * 60 * 1000,
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
	res.redirect("/#?navigate=dashboard" + videoId);
});

app.get('/dashboard', requireLogin, function(req, res){
	res.redirect("/#?navigate=dashboard");
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
		console.log(user.verification);
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
app.get('/video/videos/:videoId', function(req, res){
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
					res.status(200).send("videoUri saved");
				});
			});
		};
	} else {
		res.status(400).send('Session user does not match');
	}
	
});

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
			getUserByUserId(senderId, res, function(sender){
				sender.hasOSMO = false;
				sender.save(function(err){
					if(err){
						res.status(200).send({msg:'OSMO handed off but update who has OSMO', error: err});
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
	var recipient = req.body.recipient;
	if(!req.user.hasOSMO){
		console.log(req.user.userId + " does not have the osmo??")
	}
	User.find({$or:[{userId:req.user.userId}, {userId: recipient}]}, function(err, users){
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
		currentUser.handOffTo = recipientUser.userId;
		
		currentUser.save(function(err){
			if(err){
				console.log({msg: "error: could not save handoff", error: err});
				res.status(400).send({msg: "error: could not save handoff", error: err});
			}
			recipientUser.referer = currentUser.userId;
			recipientUser.save(function(err){
				if(err){
					console.log({msg:"error: saved handoff but not referrer", error: err});
					res.status(400).send({msg:"error: saved handoff but not referrer", error: err});

				}
				sendHandoffEmail(currentUser.userId, recipient.userId);
				res.status(200).send({msg:"success: next user selected"});
			});
		});


	});
});
/*
 *	Get all users that matches a specific filter
 */
app.get('/osmo/db/users/:filter', function(req, res){
	var filter = req.params.filter;
	console.log(filter);
	if(filter == "hasnotupload"){
		User.find({uploadComplete: {$exists:false}}, function(err, users){
			if(err){
				res.status(400).send({msg: "error", error: err});

			}
			res.status(200).send({msg: "success", users: users});

		});
	} else {
		// get all users by default
		User.find({}, function(err, users){
			if(err){
				res.status(400).send({msg: "error", error: err});

			}
			res.status(200).send({msg: "success, no filters specified", error: users});

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
 *	Get all users with media
 */	
app.get('/osmo/db/users/media', function(req, res){
	getUsersWithMedia(function(usersJSON){
		res.status(200).send(usersJSON);
	}, function(err){
		res.status(400).send('could not retrieve users');
	});
	
});
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