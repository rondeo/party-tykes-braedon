const mongoose = require('mongoose');
const RefundSchema = require('./../../../models/refunds');
const FulfillmentReturnSchema = require('./../../../models/fulfillmentReturn');
const uuid = require('uuid/v4');
const bcrypt = require('bcryptjs');
const format = require('date-format');
const config = require('config');

module.exports.showAllRefunds = async (req, res, next) => {
    const refundsData = await RefundSchema.find({});
    res.render('refunds/all-refunds', { refundsData, request_url: 'refunds', user: req.session.name, email: req.session.email, role: req.session.role });
}


module.exports.acceptRefunds = async (req, res, next) => {
    var sellerfulfillmentOrderId = req.params.id;
    const accessKey = req.session.AccessKey;
    const accessSecret = req.session.AccessSecret;
    var amazonMws = require('amazon-mws')(accessKey, accessSecret);

    await amazonMws.fulfillmentOutboundShipment.search({
        'Version': '2010-10-01',
        'Action': 'GetFulfillmentOrder',
        'SellerId': req.session.SellerID,
        'MWSAuthToken': req.session.MwsToken,
        'AWSAccessKeyId': accessKey,
        'Secret Key': accessSecret,
        //'SellerFulfillmentOrderId': '113-5729894-4414655'
        'SellerFulfillmentOrderId': sellerfulfillmentOrderId
    }, function (error, response) {
        if (error) {
            console.log('error ', error);
            req.flash('error_msg', 'This order was not fulfilled, so it is not ready for accept the refund !');
            res.redirect('/refunds/show-refunds');
            return;
        }

        var sellerSKU = response.FulfillmentOrderItem.member.SellerSKU;
        var shipmentId = response.FulfillmentShipment.member.AmazonShipmentId;
        var sellerFulfillmentOrderItemId = response.ReturnItemList.member.SellerFulfillmentOrderItemId;

        amazonMws.fulfillmentOutboundShipment.search({
            'Version': '2010-10-01',
            'Action': 'ListReturnReasonCodes',
            'SellerId': req.session.SellerID,
            'MWSAuthToken': req.session.MwsToken,
            'MarketplaceId': req.session.Marketplace,
            'AWSAccessKeyId': accessKey,
            'Secret Key': accessSecret,
            'SellerSKU': sellerSKU
        }, function (error, response) {
            if (error) {
                console.log('error---', error);
                return;
            }

            var reasonCode = response.ReasonCodeDetailsList.member;
            res.render('refunds/accept_refund', {sellerFulfillmentOrderItemId: sellerFulfillmentOrderItemId, shipmentId: shipmentId, sellerfulfillmentOrderId: sellerfulfillmentOrderId, reasonCodes: reasonCode, request_url: 'refunds', user: req.session.name, email: req.session.email, role: req.session.role });
        });
    });
}

module.exports.postAcceptRefunds = async (req, res, next) => {
    const accessKey = req.session.AccessKey;
    const accessSecret = req.session.AccessSecret;
    var amazonMws = require('amazon-mws')(accessKey, accessSecret);
    var SellerFulfillmentOrderId = req.body.SellerFulfillmentOrderId;
    var SellerReturnItemId = req.body.SellerReturnItemId;
    var SellerFulfillmentOrderItemId = req.body.sellerFulfillmentOrderItemId;
    var AmazonShipmentId = req.body.AmazonShipmentId;
    var ReturnReasonCode = req.body.ReturnReasonCode;
    var ReturnComment = req.body.ReturnComment;
    amazonMws.fulfillmentOutboundShipment.create({
        'Version': '2010-10-01',
        'Action': 'CreateFulfillmentReturn',
        'SellerId': req.session.SellerID,
        'MWSAuthToken': req.session.MwsToken,
        'SellerFulfillmentOrderId': SellerFulfillmentOrderId,
        'Items.member.1.SellerReturnItemId': SellerReturnItemId,
        'Items.member.1.SellerFulfillmentOrderItemId': SellerFulfillmentOrderItemId,
        'Items.member.1.AmazonShipmentId': AmazonShipmentId,
        'Items.member.1.ReturnReasonCode': ReturnReasonCode,
        'Items.member.1.ReturnComment': ReturnComment
    }, function (error, response) {
        if (error) {
            if (error.Code == 'InvalidRequestException' && error.StatusCode == 400) {
                console.log('already exist------');
            }
        }
        else {
            const FulfillmentReturn = FulfillmentReturnSchema({
                SubmissionDate: Date.Now(),
                SellerFulfillmentOrderId: response.ReturnItemList.member.SellerFulfillmentOrderId,
                ReturnAuthorizationId: response.ReturnItemList.member.ReturnAuthorizationId,
                AmazonShipmentId: response.ReturnItemList.member.AmazonShipmentId,
                ReturnComment: response.ReturnItemList.member.ReturnComment,
                StatusChangedDate: response.ReturnItemList.member.StatusChangedDate,
                SellerReturnItemId: response.ReturnItemList.member.SellerReturnItemId,
                AmazonReturnReasonCode: response.ReturnItemList.member.AmazonReturnReasonCode,
                Status: response.ReturnItemList.member.Status,
                ReturnToAddress: response.ReturnAuthorizationList.member.ReturnToAddress,
                AmazonRmaId: response.ReturnAuthorizationList.member.AmazonRmaId,
                ReturnAuthorizationId: response.ReturnAuthorizationList.member.ReturnAuthorizationId,
                FulfillmentCenterId: response.ReturnAuthorizationList.member.responseFulfillmentCenterId,
                RmaPageURL: response.ReturnAuthorizationList.member.RmaPageURL,
                fulfillmentReturn: true
            });

            FulfillmentReturn.save(((error) => {
                if (error) {
                    console.log(error)
                }
                console.log('Fulfillment Return Saved!!');
            }));

        }

        res.redirect('/refunds/show-refunds');
    });
}

module.exports.getRefundDetails = async (req, res, next) => {
    var SellerFulfillmentOrderId = req.params.id;
    const accessKey = req.session.AccessKey;
    const accessSecret = req.session.AccessSecret;
    var amazonMws = require('amazon-mws')(accessKey, accessSecret);
    
    amazonMws.fulfillmentOutboundShipment.search({
        'Version': '2010-10-01',
        'Action': 'GetFulfillmentOrder',
        'SellerId': req.session.SellerID,
        'MWSAuthToken': req.session.MwsToken,
        'Secret Key': accessSecret,
        //'SellerFulfillmentOrderId': '113-5729894-4414655'
        'SellerFulfillmentOrderId': SellerFulfillmentOrderId
    }, function (error, response) {
        if (error) {
            console.log('error ', error);
            return;
        }
        var SellerFulfillmentOrderId = response.FulfillmentOrder.SellerFulfillmentOrderId;
        var ReturnAuthorization = response.ReturnAuthorizationList.member;
        var ReturnItemList = response.ReturnItemList.member;
        res.render('refunds/refund_details', { SellerFulfillmentOrderId : SellerFulfillmentOrderId, ReturnAuthorization:ReturnAuthorization, ReturnItemList: ReturnItemList, request_url: 'refunds', user: req.session.name, email: req.session.email, role: req.session.role });
    });
}