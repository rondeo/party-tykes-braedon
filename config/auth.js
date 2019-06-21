
module.exports = {
	ensureAuthenticated: function(req, res, next) {
		if (req.isAuthenticated() || (req.session.name != null && req.session.name != undefined)) {
			return next();
		}
		res.redirect('/');
	}
};