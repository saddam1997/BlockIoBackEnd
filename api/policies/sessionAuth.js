/**
 * sessionAuth
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */
module.exports = function(req, res, next) {

  // User is allowed, proceed to the next policy,
  // or if this is the last policy, the controller
  console.log("session is called............");
  if (req.session.User) {
    next();
  }else{
    var requireLoginError=[
      {
        name: 'requireLogin',
        message: 'You must be sign in!'
      }
    ]
    // req.session.flash={
    //   err: requireLoginError
    // }
    //res.redirect('/signin');
    console.log("Redirect to sessionAuth new");
     return res.json([{"status":500},{"data":"You must be sign in!"}]);
  }
};
