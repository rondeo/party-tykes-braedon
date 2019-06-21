const mongoose = require('mongoose');
const User = mongoose.model('User');
var AmazonOrdersSchema = require('./../../../models/amazonOrders');
const uuid = require('uuid/v4');
var format = require('date-format');
const bcrypt = require('bcryptjs');
const config = require('config');
var Order = require('./../../../models/amazonOrders');

module.exports.showAllSales = async (req, res, next) => {
    const Sales = await AmazonOrdersSchema.find({});
    res.render('sales/all_sales', {
        Sales: Sales,
        request_url: 'sales',
        user: req.session.name,
        email: req.session.email,
        role: req.session.role
    });
}

module.exports.postshowAllSales = async (req, res, next) => {
    var today = new Date();

    if (req.body.select_val == 'weekly') {
        var date1 = new Date();
        var date2 = date1.toISOString();
        var lastweek = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate() - 7);
        var lastweek1 = lastweek.toISOString();
        await AmazonOrdersSchema.aggregate([{
                $match: {
                    "PurchaseDate": {
                        $gte: lastweek1,
                        $lt: date2
                    }
                }
            }, ])
            .exec(function (err, data) {
                if (err)
                    console.log('err', err);
                console.log('data---', data.length);
                res.send({
                    Sales: data,
                    request_url: 'sales',
                    user: req.session.name,
                    email: req.session.email,
                    role: req.session.role
                })
            })
    }

    if (req.body.select_val == 'monthly') {
        var tdy = new Date();
        var date_today = tdy.toISOString();
        var date2 = new Date();
        var month_d = new Date(date2.setMonth(date2.getMonth() - 1));
        var month_dt = month_d.toISOString();

        await AmazonOrdersSchema.aggregate([{
                $match: {
                    "PurchaseDate": {
                        $gte: month_dt,
                        $lte: date_today
                    }
                }
            }, ])
            .exec(function (err, data1) {
                if (err)
                    console.log('err', err);
                //   console.log('data monthly---', data1.length);
                res.send({
                    Sales: data1,
                    request_url: 'sales',
                    user: req.session.name,
                    email: req.session.email,
                    role: req.session.role
                })

        })
    }

    if (req.body.select_val == 'yearly') {
        var tdy = new Date();
        var date_today1 = tdy.toISOString();
        var dateString3 = new Date();
        var year_d = new Date(dateString3.setFullYear(dateString3.getFullYear() - 1));
        var yearly_dt = year_d.toISOString();

        await AmazonOrdersSchema.aggregate([{
                $match: {
                    "PurchaseDate": {
                        $gte: yearly_dt,
                        $lt: date_today1
                    }
                }
            }, ])
            .exec(function (err, data2) {
                if (err)
                    console.log('err', err);
                console.log('data yearly---', data2.length);
                res.send({
                    Sales: data2,
                    request_url: 'sales',
                    user: req.session.name,
                    email: req.session.email,
                    role: req.session.role
                })
            })

    }


}

module.exports.deleteSales = (req, res, next) => {

    AmazonOrdersSchema.findByIdAndRemove(req.session.userid, (err) => {
        if (err) return next(err);

        req.flash('success_msg', 'Sales deleted successfully !');
        res.redirect('/sales/all-sales');
    });
}