
module.exports.showCharts = (req, res, next) => {
	var user = req.session.name;
    var email = req.session.email;
    var role = req.session.role;
    res.render('charts/show-all-charts', {request_url: 'charts', user: user, email: email, role: role});
}


