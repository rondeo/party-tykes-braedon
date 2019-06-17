
module.exports = {
	ensureAuthenticated: function(req, res, next) {
		if (req.isAuthenticated() || (req.session.name != null && req.session.name != undefined)) {
			return next();
		}
		res.redirect('/');
	}
};

    // "MWS_ACCESS_KEY": "AKIAIWVDEXSALJQOLGXQ",
	// "MWS_ACCESS_SECRET": "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",