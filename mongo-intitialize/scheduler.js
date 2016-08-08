var nodemailer = require('nodemailer'),
		smtpTransport = require('nodemailer-smtp-transport'),
		schedule = require('node-schedule');
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

var sendEmail = function(){
	transporter.sendMail({
    from: 'tingche@cisco.com',
    to: 'tingche@cisco.com',
    subject: 'Test',
    html: "scheduler!!" 
	}, function(error, response) {
	   if (error) {
	        console.log(error);
	   } else {
	        console.log('Message sent');
	   }
	});
};


// dateTrigger.setDate(now.getDate() + 2);
setTimeout(sendEmail, 30*1000);