const mongoose = require('mongoose');
const User = mongoose.model('User');
const config = require('config');
var async = require('async');
var format = require('date-format');
var AmazonFulfillmentSchema = require('./../../../models/amazonFulfillmentOrders');
const accessKey = config.get('MWS_ACCESS_KEY');
const accessSecret = config.get('MWS_ACCESS_SECRET');
const amazonMws = require('./../../../lib/amazon-mws')(accessKey, accessSecret);

module.exports.fetchAmazonFulfillments = async(req, res, next) => {
    var amznFulfillments = [];
    var myData = await User.find({'isMwsVerified' : true});

    myData.forEach((item, index) => {

        // Function to retrieve fulfillments.
        async function GetAllFulfillments(listAllOrdersCallback) {
            var event = new Date();
            var prev_months = event.setDate(event.getDate() - 30);
            var PostedAfter = new Date(prev_months);
            var today = new Date();

            await amazonMws.fulfillmentOutboundShipment.search({
                    'Version': '2010-10-01',
                    'Action': 'ListAllFulfillmentOrders',
                    'SellerId': item.SellerID,
                    'MWSAuthToken': item.MwsToken,
                    'QueryStartDateTime': PostedAfter,
                    'QueryEndDateTime': today

                },function (error, response) {
                    if (error) {
                        console.log('error ', error);
                    }
                    console.log('response-----', response);
                    //var orders = (response.FulfillmentOrders.member != null && response.FulfillmentOrders.member != undefined)? response.FulfillmentOrders.member : '';
                    //var nextToken = response.NextToken ? response.NextToken : "";

                    
                    if (response !== null && response !== undefined) {
                        if(response.FulfillmentOrders.member == null || response.FulfillmentOrders.member == undefined){
                            console.log('no fulfillments available--');
                        }
                        
                        if (response.FulfillmentOrders.member != null && response.FulfillmentOrders.member != undefined && response.FulfillmentOrders.member.constructor === Object) {
                            console.log('object-------');
                            amznFulfillments[0] = response.FulfillmentOrders.member;
                            console.log('objects--- amznOrders---', amznFulfillments);
                        }
                        if (response.FulfillmentOrders.member != null && response.FulfillmentOrders.member != undefined && Array.isArray(response.FulfillmentOrders.member)){
                            console.log('array-------');
                            amznFulfillments = response.FulfillmentOrders.member;
                            console.log('objects--- amznOrders---', amznFulfillments);
                        }

                        amznFulfillments.map((order, key) => {

                            var date = new Date(order.PurchaseDate);

                            const amznFulfillments = AmazonFulfillmentSchema({
                                userid: item._id,
                                AmazonOrderId: order.SellerFulfillmentOrderId,
                                SellerFulfillmentOrderId: order.SellerFulfillmentOrderId,
                                DisplayableOrderDateTime: order.DisplayableOrderDateTime,
                                ShippingSpeedCategory: order.ShippingSpeedCategory,
                                FulfillmentMethod: order.FulfillmentMethod,
                                FulfillmentOrderStatus: order.FulfillmentOrderStatus,
                                FulfillmentMethod: order.FulfillmentMethod,
                                FulfillmentPolicy: order.FulfillmentPolicy,
                                StatusUpdatedDateTime: order.StatusUpdatedDateTime,
                                DisplayableOrderId: order.DisplayableOrderId,
                                DisplayableOrderComment: order.DisplayableOrderComment,
                                DestinationAddress: order.DestinationAddress
                            });

                            amznFulfillments.save(((error) => {
                                if (error) {
                                    console.log(error)
                                }
                                console.log('Fulfillments Saved!!');
                            }));

                            //res.send('fulfillments saved !!!!');  
                        })
                    }
                    else{
                        console.log('response is null');
                    }
                    //}

                
            });
        }

        async.waterfall([
            GetAllFulfillments
        ], (error) => {
            if (error) {
                console.log(error);
            }
        })
    })
}

