var AmazonOrdersSchema = require('./../../../models/amazonOrders');
var cron = require('node-cron');
var format = require('date-format');
var async = require('async');
const config = require('config');
var fs = require('fs');
var uuid = require('uuid').v4();
var events = require("events");
var eventsEmitter = new events.EventEmitter();

module.exports.ordersByDuration = (req, res) => {

    const { ordersDate } = req.body;

    var resultDate = '';
    var currentDate = new Date();

    if (!ordersDate) {
        res.status(400).json({ message: 'No duration provided!', success: false })
    } else {
        if (ordersDate === 'year') {

            var today = new Date();
            today.setFullYear(today.getFullYear() - 1);
            resultDate = new Date(today)

        } else if (ordersDate === 'month') {

            var today = new Date();
            today.setMonth(today.getMonth() - 1);
            resultDate = new Date(today)

        } else {

            function getLastWeek() {
                var today = new Date();
                var lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
                return lastWeek;
            }

            var lastWeek = getLastWeek();
            var lastWeekMonth = lastWeek.getMonth() + 1;
            var lastWeekDay = lastWeek.getDate();
            var lastWeekYear = lastWeek.getFullYear();
            var lastWeekDisplay = lastWeekMonth + "/" + lastWeekDay + "/" + lastWeekYear;
            resultDate = new Date(lastWeekDisplay);

        }
    }

    AmazonOrdersSchema.find({
        PurchaseDate: {
            $gte: format('dd-MM-yyyy', resultDate),
            $lt: format('dd-MM-yyyy', currentDate)
        }
    }, (err, orders) => {
        if (err) {
            res.status(500).json({ message: 'Error while retrieving data from database.', success: false })
        } else {
            res.json({ success: true, data: orders })
        }
    })
}

module.exports.fetchAllOrders = (req, res) => {

    AmazonOrdersSchema.find({}, (err, orders) => {
        if (err) {
            res.status(500).json({ success: false, message: 'Error while fetching orders data.' });
        } else {
            res.json({ data: orders, success: true })
        }
    });

    // console.log('get orders route hit!');

    // const { id } = req.user;

    // var ordersPromise = new Promise((resolve, reject) => {

    //     AmazonOrdersSchema.find({ 'userid': id }, (err, data) => {
    //         if (err) {
    //             reject(err)
    //         } else {
    //             resolve(data)
    //         }
    //     });
    // });

    // ordersPromise.then((orders) => {
    //     res.json({ data: orders, success: true })
    // }).catch((error) => {
    //     res.status(500).json({ success: false, message: 'Error while fetching orders data.' });
    // })

}
