/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var bitcoin = require('bitcoin');

module.exports = {


	createusingtoken: function (req, res) {
			if (req.body.password !== req.body.confirmPassword) {
				return res.json(401, {err: 'Password doesn\'t match, What a shame!'});
			}
			User.create(req.body).exec(function (err, user) {
				if (err) {
					return res.json(err.status, {err: err});
				}
				// If user created successfuly we return user and token as response

				if (user) {
					// NOTE: payload is { id: user.id}
					res.json(200, {user: user, token: jwToken.issue({id: user.id})});
				}
			});
	},
		create: function(req, res, next) {
			console.log("Creating new address ..................... ");
			var client = new bitcoin.Client({
					 host: 'localhost',
					 port: 8332,
					 user: 'test',
					 pass: 'test',
					 timeout: 30000
		 	});
			var batch = [];
			for (var i = 0; i < 1; ++i) {
				batch.push({
					method: 'getnewaddress',
					params: [req.param('email')]
				});
			}
			client.cmd(batch, function(err, newCreateAddress, resHeaders) {
				if (err){
					console.log("Error to create new Address");
					return res.json(500, { error: err });
				}
				console.log("User Create ......");
				var newUserAddressDetails ={
					label:"default",
					userAddress:newCreateAddress
				}
				var userObj = {
					email: req.param('email'),
					password: req.param('password'),
					userAddresses: newUserAddressDetails
				}
				User.create(userObj, function userCreated(err, user) {
						if (err){
							console.log("User Create err..............");
							console.log(err);
							return res.json(err);
						}
						User.publishCreate(user);
						console.log("User Create Succesfully......");
						return res.json(user);
				});
	    });
	  },
	  dashboard: function(req, res, next) {
			console.log("Open dashboard "+req.param('id'));
			User
			.findOne(req.param('id'))
			.then(function (user){
				return res.json(user);
			})
			.catch(function (err){
				if (err) return res.serverError(err);
			});
	  },
		createNewAddressApi: function(req, res, next) {
				console.log("createNewAddressApi called........."+req.param('email'));
				var client = new bitcoin.Client({
				 host: 'localhost',
				 port: 8332,
				 user: 'test',
				 pass: 'test',
				 timeout: 30000
			 });
				var batch = [];
				for (var i = 0; i < 1; ++i) {
					batch.push({
						method: 'getnewaddress',
						params: [req.param('email')]
					});
				}
				client.cmd(batch, function(err, newCreateAddress, resHeaders) {
					if (err) return console.log(err);
					var userAddressesObj={
						label:req.param('label'),
						user:req.param('id'),
						userAddress:newCreateAddress
					}
					UserAddresses.create(userAddressesObj, function userAddCreated(err, userAddresses) {
							 if (err){
										console.log("User Create err..............");
										console.log(err);
											// 	req.session.flash={
											//  		err: err
											// 	}
										return res.json(err);
							 }
							 UserAddresses.publishCreate(userAddresses);
							 console.log("User Create Succesfully......");
							 User
								.findOne(req.param('id'))
								.populateAll()
								.then(function (user){
									  return res.json(user);
								})
								.catch(function (err){
									if (err) return res.serverError(err);
								});
							// console.log("redicted id :: "+req.session.User.id);
							// res.redirect('/user/dashboard/'+req.session.User.id);
							 //res.json(userAddresses);
					});


				});
	  },
		sendAmountToAddressApi: function(req, res, next) {
				console.log("sendToAddressApi called.........");
				var client = new bitcoin.Client({
				 host: 'localhost',
				 port: 8332,
				 user: 'test',
				 pass: 'test',
				 timeout: 30000
			 });
				var batch = [];
				for (var i = 0; i < 1; ++i) {
					batch.push({
						method: 'sendtoaddress',
						params: [req.param('recieverAddress'),
										 req.param('amount'),
										 req.param('commentForSender'),
										 req.param('commentForReciever')]
					});
				}
				client.cmd(batch, function(err, transactionDetails, resHeaders) {
					if (err) return res.serverError(err);

					console.log("transactionDetails::: "+transactionDetails);

				});
	  }
};
