/**
 * SessionController
 *
 * @description :: Server-side logic for managing sessions
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
 var bitcoin = require('bitcoin');

module.exports = {

	create: function(req, res, next) {
    console.log(req.param('email')+ "  create.........................   "+req.param('password'));
    if (!req.param('email') || !req.param('password')) {
      var usernamePasswordRequiredError = [{
        name: 'usernamePasswordRequired',
        message: 'You must enter both a username and password.'
      }]
      // Remember that err is the object being passed down (a.k.a. flash.err), whose value is another object with
      // the key of usernamePasswordRequiredError
      // req.session.flash = {
      //   err: usernamePasswordRequiredError
      // }
			console.log("create....usernamePasswordRequiredError.....................");

      return res.json([{"status":500},{"data":"Username and Password required"}]);
    }

    // Try to find the user by there email address.
    // findOneByEmail() is a dynamic finder in that it searches the model by a particular attribute.
    // User.findOneByEmail(req.param('email')).done(function(err, user) {
    User.findOneByEmail(req.param('email'), function foundUser(err, user) {
			console.log("create....findOneByEmail.....................");
      if (err) return next(err);
			//console.log("create....findOneByEmail not error....................."+user.id);
      // If no user is found...
      if (!user) {
        var noAccountError = [{
          name: 'noAccount',
          message: 'The email address ' + req.param('email') + ' not found.'
        }]
        // req.session.flash = {
        //   err: noAccountError
        // }
				console.log("create....findOneByEmail User Not found.....................");

        console.log("User Not found");
        return res.json([{"status":500},{"data":"User Not found"}]);
      }
			var passworddetails=req.param('password');
			console.log(user.password==passworddetails);
      if (req.param('password') != user.password) {

				console.log("email and password miss match found");
				return  res.json([{"status":500},{"data":"Password mismatch"}]);
      }
			if (req.param('password') == user.password) {
        req.session.authenticated = true;
				req.session.User = user;
         User
        .findOne(req.session.User.id)
        .populateAll()
        .then(function (user){
          console.log("returning data to user "+JSON.stringify(user));
            return res.json(user);
        })
      }
    });
  },
  destroy: function(req, res, next) {
        // Wipe out the session (log out)
				console.log("session destroy.....................");
        req.session.destroy();
				 //$(".noty_info").show();
        // Redirect the browser to the sign-in screen
        res.redirect('/');
  }
};
