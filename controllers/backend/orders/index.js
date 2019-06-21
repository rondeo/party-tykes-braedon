var AmazonOrdersSchema = require('./../../../models/amazonOrders');
var AmazonProductsSchema = require('./../../../models/amazonProducts');
var AmazonFulfillmentSchema = require('./../../../models/amazonFulfillmentOrders');
const config = require('config');
var moment = require('moment');
const format = require('date-format');
const fs = require('fs');
var fse = require('fs-extra');
const accessKey = config.get('MWS_ACCESS_KEY');
const accessSecret = config.get('MWS_ACCESS_SECRET');
const amazonMws = require('./../../../lib/amazon-mws')(accessKey, accessSecret);
const mongoose = require('mongoose');
const User = mongoose.model('User');
var Decimal = require('decimal');

module.exports.showOrders = async (req, res, next) => {
    const Orders = await AmazonOrdersSchema.find({ 'userid': req.session.userid });
    res.render('orders/all-orders', { Orders, moment: moment, request_url: 'manage_orders', user: req.session.name, email: req.session.email, role: req.session.role });
}

// module.exports.showOrders = async (req, res, next) => {
//     // console.log(req.session.email);
//     const data = await User.find({ 'email': req.session.email });
//     //  console.log(data)
//     //  console.log('Created date',data[0].created)
//     const reg_date = data[0].created;
//     var date = format('MM/dd/yyyy', new Date(reg_date));
//     console.log('date---', date);

//     const Orders = await AmazonOrdersSchema.find();

//    var reg_purchase = Orders[0].PurchaseDate;
//    console.log('>>>>>>>...',reg_purchase);
//     var purchase = format('MM/dd/yyyy', new Date(reg_purchase));
//       console.log("purchase",purchase)
//     res.render('orders/all-orders', { purchase:purchase, date: date, Orders, request_url: 'manage_orders', user: req.session.name, email: req.session.email, role: req.session.role });
// }

module.exports.showOrdersByDate = async (req, res, next) => {
    const Orders = await AmazonOrdersSchema.find({ 'PurchaseDate': 18 - 5 - 2019 });
    res.render('orders/all-orders', { Orders, request_url: 'manage_orders', user: req.session.name, email: req.session.email, role: req.session.role });
}

module.exports.fulfillmentOrders = async (req, res, next) => {
    const orders = await AmazonFulfillmentSchema.find({ "userid": req.session.userid });
    res.render('orders/fulfillment_orders', { orders, request_url: 'fulfillment_orders', user: req.session.name, email: req.session.email, role: req.session.role });
}

module.exports.addOrder = (req, res, next) => {
    res.render('orders/add-order', { sellerid: req.session.SellerID, request_url: 'manage_orders', user: req.session.name, email: req.session.email, role: req.session.role });
}

module.exports.postaddOrder = (req, res, next) => {
    var sellerid = req.session.SellerID;
    var AmazonOrderID = req.body.AmazonOrderID;
    var Carrier_code = req.body.Carrier_code;
    var ship_method = req.body.ship_method;
    var track_number = req.body.track_number;
    var order_itemid = req.body.order_itemid;
    var quantity = req.body.quantity;
    var content = '<?xml version=“1.0” encoding=“UTF-8” standalone=“no”?>'
        + '<AmazonEnvelope xmlns:xsi=“http://www.w3.org/2001/XMLSchema-instance” xsi:noNamespaceSchemaLocation=“amzn-envelope.xsd”>'
        + '<Header>'
        + '<DocumentVersion>1.01</DocumentVersion>'
        + '<MerchantIdentifier>' + sellerid + '</MerchantIdentifier>'
        + '</Header>'
        + '<MessageType>OrderFulfillment</MessageType>'
        + '<Message>'
        + '<MessageID>1</MessageID>'
        + '<OperationType>Update</OperationType>'
        + '<OrderFulfillment>'
        + '<AmazonOrderID>' + AmazonOrderID + '</AmazonOrderID>'
        + '<FulfillmentDate>2019-01-23T23:44:11Z</FulfillmentDate>'
        + '<FulfillmentData>'
        + '<CarrierCode>' + Carrier_code + '</CarrierCode>'
        + '<ShippingMethod>' + ship_method + '</ShippingMethod>'
        + '<ShipperTrackingNumber>' + track_number + '</ShipperTrackingNumber>'
        + '</FulfillmentData>'
        + '<Item>'
        + '<AmazonOrderItemCode>' + order_itemid + '</AmazonOrderItemCode>'
        + '<Quantity>' + quantity + '</Quantity>'
        + '</Item>'
        + '</OrderFulfillment>'
        + '</Message>'
        + '</AmazonEnvelope>';

    fs.writeFile('MWS/File.txt', content, function (err) {
        if (err) throw err;
        var FeedContent = fse.readFileSync('MWS/File.txt', 'UTF-8');
        amazonMws.feeds.submit({
            'Version': '2009-01-01',
            'Action': 'SubmitFeed',
            'FeedType': '_POST_ORDER_FULFILLMENT_DATA_',
            'FeedContent': FeedContent,
            'SellerId': 'AOD4LKCG1A3T2',
            'MWSAuthToken': 'amzn.mws.a6b277bc-540c-ea9f-4abf-d1111c560568',
        }, function (error, response) {
            if (error) {
                console.log('error ', error);
                return;
            }
            console.log('response-----', response);
            res.redirect('/orders/all-orders');
        });
    });


}

module.exports.fulfillmentDetails = async (req, res, next) => {
    amazonMws.fulfillmentOutboundShipment.search({
        'Version': '2010-10-01',
        'Action': 'GetFulfillmentOrder',
        'SellerId': req.session.SellerID,
        'MWSAuthToken': req.session.MwsToken,
        'AWSAccessKeyId': accessKey,
        'Secret Key': accessSecret,
        'SellerFulfillmentOrderId': req.params.id
    }, function (error, response) {
        if (error) {
            console.log('error ', error);
            return;
        }

        var fulfillment_details = response.FulfillmentShipment.member;
        console.log('fulfillment_details----', fulfillment_details);
        res.render('orders/fulfillment_details', { fulfillment_details, request_url: 'fulfillment_orders', user: req.session.name, email: req.session.email, role: req.session.role });
    });
}

module.exports.trackingDetails = async (req, res, next) => {

    amazonMws.fulfillmentOutboundShipment.search({
        'Version': '2010-10-01',
        'Action': 'GetPackageTrackingDetails',
        'SellerId': req.session.SellerID,
        'MWSAuthToken': req.session.MwsToken,
        'AWSAccessKeyId': accessKey,
        'Secret Key': accessSecret,
        'PackageNumber': req.params.id
    }, function (error, response) {
        if (error) {
            console.log('error ', error);
            return;
        }

        var tracking_date = new Date(response.ShipDate);
        var date = tracking_date.getDate();
        var month = tracking_date.getMonth();
        var year = tracking_date.getFullYear();
        var myData = '<table style="width: 100%;" border="1px">'
            + '<tr><td style="width: 60%; padding:6px;">&nbsp;Current Status</td><td>&nbsp;<b>' + response.CurrentStatus + '</b></td></tr>'
            + '<tr><td style="padding:6px;">&nbsp;Tracking Number</td><td>&nbsp;' + response.TrackingNumber + '</td></tr>'
            + '<tr><td style="padding:6px;">&nbsp;Shipped Date</td><td>&nbsp;' + date + '-' + month + '-' + year + '</td></tr>'
        myData += '</table>';
        res.json(myData);
        return res.end();
    });
}

module.exports.deleteOrder = (req, res, next) => {

    AmazonOrdersSchema.findByIdAndRemove(req.params.id, (err) => {
        if (err) return next(err);

        req.flash('success_msg', 'Order deleted successfully !');
        res.redirect('/orders/all-orders');
    });
}