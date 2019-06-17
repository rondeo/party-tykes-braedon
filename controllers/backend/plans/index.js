const async = require('async');
var PlansSchema = require('./../../../models/plans');
var serviceSchema = require('./../../../models/services');
const mongoose = require('mongoose');
const User = mongoose.model('User');
//const localStorage = require('localStorage');

module.exports.showAllPlans = async (req, res, next) => {
    const plans = await PlansSchema.find({ user_id : req.session.userid });
    console.log('plans--------', plans);
    res.render('plans/all-plans', { plans, request_url : 'manage_plans', user: req.session.name, email: req.session.email, role: req.session.role });
}

module.exports.addPlan = async (req, res, next) => {
    const services = await serviceSchema.find({ user_id : req.session.userid });
    const serviceNames = services.map((val, key) => val.name);
    res.render('plans/add-plan', { myservices: serviceNames,  request_url : 'add_plan', user: req.session.name, email: req.session.email, role: req.session.role, user_id: req.session.userid });
}

module.exports.submitPlan = (req, res, next) => {
    const planModel = new PlansSchema(req.body);

    const servSchema = serviceSchema({
        user_id: planModel.user_id,
        name: planModel.service,
        description: planModel.description,
        status: planModel.status,
    });

    async.parallel({
        one(callback) {
            planModel.save(((error, data) => {
                if (error) { callback(error); }
                req.flash('success_msg', 'Plan added successfully !');
                res.redirect('/plans/all-plans');
            }));
        },
        two(callback) {
            servSchema.save((err, doc) => {
                if (!err) { callback(err); } else { console.log(JSON.stringify(err, undefined, 2)); }
            });
        },
    }, (err, results) => { });
}

module.exports.getEditPlan = async (req, res, next) => {
    const plan = await PlansSchema.findById(req.params.id);
    res.render('plans/edit-plan', { plan, request_url : 'add_plan', user: req.session.name, email: req.session.email, role: req.session.role});
}

module.exports.postEditPlan = (req, res, next) => {
    PlansSchema.findByIdAndUpdate(req.params.id, req.body, (err) => {
        if (err) {
            console.log(err);
        }
        req.flash('success_msg', 'Plan updated successfully !');
        res.redirect('/plans/all-plans');
    });
}

module.exports.deletePlan = (req, res, next) => {
    PlansSchema.findByIdAndRemove(req.params.id, (err) => {
        if (err) return next(err);
        req.flash('success_msg', 'Plan deleted successfully !');
        res.redirect('/plans/all-plans');
    });
}

module.exports.togglePlanStatus = (req, res, next) => {
    PlansSchema.findByIdAndUpdate(req.body.id, req.body, (err, data) => {
        if (err) throw err;
        res.json({ status: req.body.status });
    });
}
