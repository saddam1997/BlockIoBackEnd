/**
 * Allow any authenticated user.
 */
module.exports = function (req, res, ok) {

  // User is allowed, proceed to controller
  if (req.session.User && req.session.User.admin) {
    console.log("admin..........if");
    next();
  }

  // User is not allowed
  else {
    console.log("admin..........else");
  	var requireAdminError = [{name: 'requireAdminError', message: 'You must be an admin.'}]
		// req.session.flash = {
		// 	err: requireAdminError
		// }
    res.redirect('/');
    return;
  }
};
