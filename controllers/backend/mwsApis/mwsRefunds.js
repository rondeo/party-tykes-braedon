const mongoose = require('mongoose');
const User = mongoose.model('User');
var _ = require('lodash');
var refund = require('./../../../models/refunds');
const config = require('config');
const format = require('date-format');
const accessKey = config.get('MWS_ACCESS_KEY');
const accessSecret = config.get('MWS_ACCESS_SECRET');
const AmazonOrdersSchema = require('./../../../models/amazonOrders');
const amazonMws = require('./../../../lib/amazon-mws')(accessKey, accessSecret);

module.exports.fetchAmazonRefunds = async(req, res, next) => {
    var event = new Date();
    var prev_months = event.setDate(event.getDate() - 180);
    var PostedAfter = new Date(prev_months);
    var myData = await User.find({'isMwsVerified' : true});
   
    myData.forEach((item, index) => {
    var financeRequest = function () {
        
        amazonMws.finances.search({
            'Version': '2015-05-01',
            'Action': 'ListFinancialEvents',
            'SellerId': item.SellerID,
            'MWSAuthToken': item.MwsToken,
            'PostedAfter': PostedAfter
        }, function (error, response) {
            if (error) {
                console.log('error ', error);
                return;
            }
            console.log(response.FinancialEvents);
            var result = response.FinancialEvents.RefundEventList.ShipmentEvent;
            var count = response.FinancialEvents.RefundEventList.ShipmentEvent.length ? response.FinancialEvents.RefundEventList.ShipmentEvent.length : '';
            
            if (Object.entries(response).length === 0 && response.constructor === Object) {
                console.log('Response is null');
            }

            if (result.constructor === Object) {
                count = 1;
                result[0] = result;
            }


            function asyncLoop(i, callback) {
                if (i < count) {
                    var OrderID = result[i].AmazonOrderId;

                    var SellerSKU = result[i].ShipmentItemAdjustmentList.ShipmentItem[i] ? result[i].ShipmentItemAdjustmentList.ShipmentItem[i].SellerSKU : result[i].ShipmentItemAdjustmentList.ShipmentItem.SellerSKU;


                    var Countfees = result[i].ShipmentItemAdjustmentList.ShipmentItem[i] ? result[i].ShipmentItemAdjustmentList.ShipmentItem[i].ItemFeeAdjustmentList.FeeComponent : result[i].ShipmentItemAdjustmentList.ShipmentItem.ItemFeeAdjustmentList.FeeComponent;


                    var Countfees_length = Countfees.length;


                    var Countcharge = result[i].ShipmentItemAdjustmentList.ShipmentItem[i] ? result[i].ShipmentItemAdjustmentList.ShipmentItem[i].ItemChargeAdjustmentList.ChargeComponent : result[i].ShipmentItemAdjustmentList.ShipmentItem.ItemChargeAdjustmentList.ChargeComponent;


                    var Countcharge_length = Countcharge.length;


                    var feestype = result[i].ShipmentItemAdjustmentList.ShipmentItem[i] ? result[i].ShipmentItemAdjustmentList.ShipmentItem[i].ItemFeeAdjustmentList.FeeComponent : result[i].ShipmentItemAdjustmentList.ShipmentItem.ItemFeeAdjustmentList.FeeComponent;


                    var feestypeLength = feestype.length;


                    var chargetype = result[i].ShipmentItemAdjustmentList.ShipmentItem[i] ? result[i].ShipmentItemAdjustmentList.ShipmentItem[i].ItemChargeAdjustmentList.ChargeComponent : result[i].ShipmentItemAdjustmentList.ShipmentItem.ItemChargeAdjustmentList.ChargeComponent;


                    var chargetypeLength = chargetype.length;


                    var refunds = new refund();

                    var date = format('yyyy-MM-dd', new Date());

                    refunds.AmazonOrderID = OrderID;
                    refunds.SellerSKU = SellerSKU;
                    refunds.userid = item._id
                    refunds.rundate = date;
                    refunds.customerid = "";
                    refunds.feeType0 = "";
                    refunds.feeType1 = "";
                    refunds.feeType2 = "";
                    refunds.feeType3 = "";
                    refunds.feeType4 = "";
                    refunds.feeType5 = "";
                    refunds.feeTypeprice0 = "";
                    refunds.feeTypeprice1 = "";
                    refunds.feeTypeprice2 = "";
                    refunds.feeTypeprice3 = "";
                    refunds.feeTypeprice4 = "";
                    refunds.feeTypeprice5 = "";
                    refunds.feeTypecurrency0 = "";
                    refunds.feeTypecurrency1 = "";
                    refunds.feeTypecurrency2 = "";
                    refunds.feeTypecurrency3 = "";
                    refunds.feeTypecurrency4 = "";
                    refunds.feeTypecurrency5 = "";
                    refunds.chargeType0 = "";
                    refunds.chargeType1 = "";
                    refunds.chargeType2 = "";
                    refunds.chargeType3 = "";
                    refunds.chargeType4 = "";
                    refunds.chargeType5 = "";
                    refunds.chargeTypeprice0 = "";
                    refunds.chargeTypeprice1 = "";
                    refunds.chargeTypeprice2 = "";
                    refunds.chargeTypeprice3 = "";
                    refunds.chargeTypeprice4 = "";
                    refunds.chargeTypeprice5 = "";
                    refunds.chargeTypecurrency0 = "";
                    refunds.chargeTypecurrency1 = "";
                    refunds.chargeTypecurrency2 = "";
                    refunds.chargeTypecurrency3 = "";
                    refunds.chargeTypecurrency4 = "";
                    refunds.chargeTypecurrency5 = "";

                    refunds.save(function (err, data) {
                        if (err)
                            console.log(err);
                        if(!data)
                            return;
                        var id = data._id;

                        function asyncLoop2(j, callback) {
                            if (j < Countfees_length) {
                                var type = feestype[j].FeeType;
                                var feeTypeprice = feestype[j].FeeAmount.CurrencyAmount;
                                var feeTypecurrency = feestype[j].FeeAmount.CurrencyCode;

                                var value = type;
                                var query1 = "feeType" + [j];
                                var query2 = "feeTypeprice" + [j];
                                var query3 = newFunction() + [j];
                                refund.findByIdAndUpdate(id, {
                                    [query1]: value,
                                    [query2]: feeTypeprice,
                                    [query3]: feeTypecurrency
                                }, function (err, result) {
                                    asyncLoop2(j + 1, callback);
                                });
                            } else {
                                callback();
                            }
                        };

                        function asyncLoop4(l, callback) {
                            const ordersData = AmazonOrdersSchema.find({ AmazonOrderID: "112-1240349-5200262" });
                            console.log('ordersData---', ordersData);
                        };

                        asyncLoop2(0, function () {

                            asyncLoop3(0, function () {

                                asyncLoop4(0, function () {
                                    asyncLoop(i + 1, callback);
                                });

                            });

                        });

                        function asyncLoop3(k, callback) {

                            if (k < chargetypeLength) {
                                var ChargeType = chargetype[k].ChargeType;
                                var amounts = chargetype[k].ChargeAmount.CurrencyAmount;
                                var chargeTypecurrency = chargetype[k].ChargeAmount.CurrencyCode;

                                var valuecharge = ChargeType;
                                var querycharge = "chargeType" + [k];
                                var querycharge2 = "chargeTypeprice" + [k];
                                var querycharge3 = "chargeTypecurrency" + [k];
                                refund.findByIdAndUpdate(id, {
                                    [querycharge]: valuecharge,
                                    [querycharge2]: amounts,
                                    [querycharge3]: chargeTypecurrency
                                }, function (err, amounts) {
                                    asyncLoop3(k + 1, callback);
                                    console.log('refund data updated !!');
                                });
                            } else {
                                callback();
                            }
                        }
                    });

                    ///////////

                    /*
                    
                    ////////////////syncLoop( i+1, callback );*/

                } else {
                    callback();
                }
            }
            asyncLoop(0, function () {
                res.send("success");
            });
        });
    };

    financeRequest();
    })
}

function newFunction() {
    return "feeTypecurrency";
}

