const mongoose = require('mongoose');
const User = mongoose.model('User');
var AmazonOrdersSchema = require('./../../../models/amazonOrders');
const uuid = require('uuid/v4');
var format = require('date-format');
const bcrypt = require('bcryptjs');
const config = require('config');
var Order = require('./../../../models/amazonOrders');

module.exports.showAllSales = async (req, res, next) => {
    console.log('req.session----', req.session);

    const Sales = await AmazonOrdersSchema.find({ 'userid': req.session.userid });
    for(var i =0; i< Sales.length; i++){
        console.log(Sales[i].PurchaseDate);
    }
    res.render('sales/all_sales', { Sales: Sales, request_url: 'sales', user: req.session.name, email: req.session.email, role: req.session.role });
}

module.exports.postshowAllSales = async (req, res, next) => {
    var today = format('dd-MM-yyyy', new Date());

    if (req.body.select_val == 'monthly') {
        var date2 = new Date();
        date2.setMonth(date2.getMonth() - 1);
        var dateString2 = format('dd-MM-yyyy', date2);
        console.log('month--- _previous', today, dateString2);

        await AmazonOrdersSchema.aggregate([
            { $match: { "userid": req.session.userid, "PurchaseDate": { $gte: dateString2} } },
        ])
            .exec(function (err, data1) {
                if(err)
                    console.log('err', err);
                console.log('data monthly---', data1.length);
            })
        // res.render('sales/all_sales', { Datas: Datas, request_url: 'sales', user: req.session.name, email: req.session.email, role: req.session.role});
    }

    if (req.body.select_val == 'weekly') {
        var date1 = new Date();
        console.log('date1', date1);
        var lastWeek = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate() - 7);
        var dateString1 = format('dd-MM-yyyy', lastWeek);
        console.log('week---', today, dateString1);

        await AmazonOrdersSchema.aggregate([
            { $match: { "userid": req.session.userid, "PurchaseDate": { $gte: dateString1 } } },
        ])
            .exec(function (err, data) {
                if(err)
                    console.log('err', err);
                console.log('week---', data.length);
                // res.render('sales/all_sales', { Sales: data, request_url: 'sales', user: req.session.name, email: req.session.email, role: req.session.role });
            })
    }

    if (req.body.select_val == 'yearly') {
        var dateString3 = new Date();
        dateString3.setFullYear(dateString3.getFullYear() -1);
        var resultDate = format('dd-MM-yyyy', new Date(dateString3));
        console.log('yearlyyyyyyy-', today, resultDate);

        await AmazonOrdersSchema.aggregate([
            { $match: { "userid": req.session.userid, "PurchaseDate": { $gte: resultDate} } },
        ])
            .exec(function (err, data2) {
                if(err)
                    console.log('err', err);
                console.log('data yearly---', data2.length);
            })
        // res.render('sales/all_sales', { Datas: Datas, request_url: 'sales', user: req.session.name, email: req.session.email, role: req.session.role});
    }

}


module.exports.deleteSales = (req, res, next) => {

    AmazonOrdersSchema.findByIdAndRemove(req.session.userid, (err) => {
        if (err) return next(err);

        req.flash('success_msg', 'Sales deleted successfully !');
        res.redirect('/sales/all-sales');
    });
}
















