/**
 * AuthController
 *
 * @description :: Server-side logic for managing auths
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

  authentcate: function (req, res) {

    var email = req.param('email');
    var password = req.param('password');

    console.log(email+" AuthController.authenticated called........."+password);
    if (!email || !password) {
      console.log("email and password required");
      return res.json(401, {err: 'email and password required'});
    }
    console.log(" findOne.authenticated called.........");
    User.findOne({email: email}, function (err, user) {
      console.log("inside... findOne.authenticated called.........");
      if (!user) {
        console.log("invalid email and password...");
        return res.json(401, {err: 'invalid email or password'});
      }

      User.comparePassword(password, user, function (err, valid) {
        console.log("inside.comparePassword.. findOne.authenticated called.........");
        if (err) {
          return res.json(403, {err: 'forbidden'});
        }

        if (!valid) {
          return res.json(401, {err: 'invalid email or password'});
        } else {

          User
           .findOne({email: email})
           .populateAll()
           .then(function (user){

             res.json({
               user: user,
               token: jwToken.issue({id : user.id })
             });
           })
           .catch(function (err){
             if (err) return res.serverError(err);
           });



        }
      });
    })
  }
};
