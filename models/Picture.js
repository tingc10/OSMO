var mongoose = require('mongoose');
Schema = mongoose.Schema;

var pictureSchema = new Schema({
	user_id	: 	String,
	file_location : String
});

var Picture = mongoose.model("Picture", pictureSchema);
module.exports = Picture;