const mongoose = require('mongoose');
const User = mongoose.model('User');
var AmazonOrdersSchema = require('./../../../models/amazonOrders');
const uuid = require('uuid/v4');
var format = require('date-format');
const bcrypt = require('bcryptjs');
const config = require('config');
const accessKey = config.get('MWS_ACCESS_KEY');
const accessSecret = config.get('MWS_ACCESS_SECRET');
var amazonMws = require('amazon-mws')(accessKey, accessSecret);
var Order = require('./../../../models/amazonOrders');

module.exports.showAllSales = async(req, res, next) => {
    const Sales = await AmazonOrdersSchema.find({'userid' : req.session.userid});
    res.render('sales/all_sales', { Sales: Sales, request_url: 'sales', user: req.session.name, email: req.session.email, role: req.session.role});
}

module.exports.postshowAllSales = async(req, res, next) => {
    var today = format('dd-MM-yyyy', new Date());
    console.log('req.body.select-----', req.body.select_val);

    if(req.body.select_val == 'monthly'){
        var date2 = new Date();
        date2.setDate(date2.getDate() - 30);
        var dateString2 = format('dd-MM-yyyy', date2);
        console.log('dateString2---', dateString2);
        console.log('today2---', today);
        await AmazonOrdersSchema.aggregate([
        { $match: {"userid" : req.session.userid, "PurchaseDate": {$gte: dateString2, $lt:today} } },         
      ])
        .exec(function(err, data1) {
            console.log('data monthly---', data1.length);
        })
     //res.render('sales/all_sales', { Datas: Datas, request_url: 'sales', user: req.session.name, email: req.session.email, role: req.session.role});
    }
    
    if(req.body.select_val == 'weekly'){
        var date1 = new Date();
        date1.setDate(date1.getDate() - 7);
        var dateString1 = format('dd-MM-yyyy', date1);
        console.log('dateString1---', dateString1, today);
        await AmazonOrdersSchema.aggregate([
        { $match: {"userid" : req.session.userid, "PurchaseDate": {$gte: dateString1, $lt:today} } },         
      ])
        .exec(function(err, data) {
            console.log('data---', data.length);
            //res.render('sales/all_sales', { Sales: data, request_url: 'sales', user: req.session.name, email: req.session.email, role: req.session.role});
        })
    }

    
    
    if(req.body.select_val == 'yearly'){
       var date3 = new Date();
        date3.setDate(date3.getDate() - 365);
        var dateString3 = format('dd-MM-yyyy', date3);
        await AmazonOrdersSchema.aggregate([
        { $match: {"userid" : req.session.userid, "PurchaseDate": {$gte: dateString3, $lt:today} } },         
      ])
        .exec(function(err, data2) {
            console.log('data yearly---', data2.length);
        })
     //res.render('sales/all_sales', { Datas: Datas, request_url: 'sales', user: req.session.name, email: req.session.email, role: req.session.role});
    }

}

