const serviceSchema = require('./../../../models/services');

module.exports.showAllServices = async (req, res, next) => {
    const services = await serviceSchema.find({ user_id : req.session.userid});
    res.render('services/all-services', { services, request_url : 'manage_services', user: req.session.name, email: req.session.email, role: req.session.role });
}

module.exports.addService = (req, res, next) => {
    res.render('services/add-service', { request_url : 'add_service', user: req.session.name, email: req.session.email, role: req.session.role, user_id: req.session.userid });
}

module.exports.postService = (req, res, next) => {

    const serviceModel = serviceSchema({
        user_id: req.body.user_id,
        name: req.body.name,
        description: req.body.description,
        status: req.body.status,
    });

    serviceModel.save(((error, data) => {
        if (error) { callback(error); }
        req.flash('success_msg', 'Service added successfully !');
        res.redirect('/services/all-services');
    }));
}

module.exports.getEditRequest = async (req, res, next) => {
    const service = await serviceSchema.findById(req.params.id);
    res.render('services/edit-service', { service, user: req.session.name, email: req.session.email, role: req.session.role, request_url : 'manage_services'});
}

module.exports.postEditRequest = (req, res, next) => {
    serviceSchema.findByIdAndUpdate(req.params.id, req.body, (err) => {
        if (err) {
            console.log(err);
        }
        req.flash('success_msg', 'Service edited successfully !');
        res.redirect('/services/all-services');
    });
}

module.exports.deleteService = (req, res, next) => {
    serviceSchema.findByIdAndRemove(req.params.id, (err) => {
        if (err) return next(err);
        req.flash('success_msg', 'Service deleted successfully !');
        res.redirect('/services/all-services');
    });
}

module.exports.toggleServiceStatus = (req, res, next) => {
    serviceSchema.findByIdAndUpdate(req.body.id, req.body, (err, data) => {
        if (err) throw err;
        res.json({ status: req.body.status });
    });
}