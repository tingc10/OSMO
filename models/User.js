var mongoose = require('mongoose');
		Schema = mongoose.Schema,
		NodeCrypto = require('crypto');

var userSchema = new Schema({
	name : String,
	userId: { 
		type: String,
		required: true,
		unique: true
	},
	location: String,
	password: String,
	name : String,
	videoUri : String,
	votes: Array,
	timeStart : Date,
	uploadComplete : Date,
	selfieLocation : String,
	verification : String,
	thumbnailLocations : Array,
	vimeoThumbnail : String,
	handoffTo : String,
	hasOSMO : Boolean,
	referer : String

});
/**
 *	Sets a new verification code that will be sent to user's email
 */
userSchema.methods.createVerification = function(){
	this.verification = NodeCrypto.randomBytes(64).toString('hex');
	return this.verification;
};

/**
 *	Returns a version without password and verification that can be sent to client
 */
userSchema.methods.toJSON = function(){
	var obj = this.toObject();
	delete obj.verification;
  delete obj.password;
  delete obj.__v;
  return obj;
};
/**
 *	Creates a verification code for new user
 */
userSchema.pre('save', function(next){
	this.createVerification(function(err, verification){
		if(err) 
			throw err;
		// console.log("User's verification is: " + verification);
	});
	next();
});

var User = mongoose.model("User", userSchema);
module.exports = User;