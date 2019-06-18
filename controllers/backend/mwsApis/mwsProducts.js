const mongoose = require('mongoose');
const User = mongoose.model('User');
const async = require('async');
var _ = require('lodash');
var AmazonProductsSchema = require('./../../../models/amazonProducts');
var arrayOne = [];
var arrayTwo = [];

module.exports.fetchAmazonProducts = async (req, res, next) => {

    console.log('Products Cron Initialised!');

    const myData = await User.find({ 'isMwsVerified': true });

    myData.forEach((item, index) => {

        const amazonMws = require('./../../../lib/amazon-mws')(item.accessKeyId, item.accessSecret);

        let ReportID = '';
        var NextToken = '';
        var REPORT_TYPE = '_GET_MERCHANT_LISTINGS_ALL_DATA_';
        var REPORT_IDS_1 = [];
        var REPORT_IDS_2 = [];
        var REFINED_REPORT_IDS = [];
        var REFINED_REPORT_IDS_2 = [];
        var FINAL_REPORT_IDS = [];
        var hasNext = ''
        var HAS_NEXT = true;
        var mwsReportIDS = [];
        var productCost = '';
        var shippingTotal = '';
        var amazonFeePerOrder = '';
        var productCostCurrency = '';
        var shippingTotalCurrency = '';
        var amazonFeePerOrderCurrency = '';

        async function promise1(listAllOrdersCallback) {
            amazonMws.reports.submit({
                Version: '2009-01-01',
                Action: 'RequestReport',
                SellerId: item.SellerID,
                MWSAuthToken: item.MwsToken,
                ReportType: REPORT_TYPE,
                MarketplaceId: item.Marketplace
            }, (error, response) => {
                if (error) {
                    console.log(error);
                }
                ReportID = response.ResponseMetadata.RequestId;
                listAllOrdersCallback(null, ReportID);
            });
        }

        async function promise2(ReportID, listOrderItemsCallback) {
            amazonMws.reports.search({
                Version: '2009-01-01',
                Action: 'GetReportRequestList',
                SellerId: item.SellerID,
                MWSAuthToken: item.MwsToken,
                ReportRequestId: ReportID,
            }, (error, response) => {
                if (error) {
                    console.log('error while using report id-----', error);
                    return;
                }

                NextToken = response.NextToken;

                hasNext = response.HasNext;

                response.ReportRequestInfo.map((reportdata, index) => {
                    if (reportdata.ReportType == REPORT_TYPE) {
                        if (reportdata.GeneratedReportId !== undefined) {
                            arrayOne.push(reportdata.GeneratedReportId);
                        }
                    }
                });
                listOrderItemsCallback(null, NextToken);
            });
        }

        async function promise3(NextToken, listOrderItems12Callback) {

            while (HAS_NEXT) {
                await amazonMws.reports.search({
                    'Version': '2009-01-01',
                    'Action': 'GetReportRequestListByNextToken',
                    'AWSAccessKeyId': item.accessKeyId,
                    'SellerId': item.SellerID,
                    'MWSAuthToken': item.MwsToken,
                    'Secret Key': item.accessSecret,
                    'NextToken': NextToken
                }, function (error, response) {
                    if (error) {
                        console.log('error while using next token----', error);
                        return;
                    }

                    response.ReportRequestInfo.map((reportdata, index) => {

                        if (reportdata.ReportType == REPORT_TYPE) {
                            if (reportdata.GeneratedReportId !== undefined && reportdata.ReportProcessingStatus == '_DONE_') {
                                arrayTwo.push(reportdata.GeneratedReportId);
                            }
                        }
                    });
                    HAS_NEXT = response.hasNext;
                });
            }
            listOrderItems12Callback(null, arrayTwo);
        }

        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        async function promise4(arrayTwo, listOrderItems1234Callback) {
            var concatArray = [];
            var finalArray = [];
            var skuArray = [];

            concatArray = arrayOne.concat(arrayTwo);

            finalArray = _.map(
                _.uniq(
                    _.map(concatArray, obj => JSON.stringify(obj)),
                ),
                obj => JSON.parse(obj),
            )

            for (let i = 1; i <= finalArray.length; i++) {

                if (i % 57 === 0) {
                    console.log('sleeep-----');
                    await sleep(600000);
                }
                await amazonMws.reports.search({
                    Version: '2009-01-01',
                    Action: 'GetReport',
                    SellerId: item.SellerID,
                    MWSAuthToken: item.MwsToken,
                    ReportId: finalArray[i],
                }, (error, response) => {

                    if (error) {
                        console.log('error while using report ID++++', error);
                        return;
                    }

                    response.data.map((products, keys) => {

                        var date = new Date(products['open-date']);

                        const amznModel = new AmazonProductsSchema({
                            ProductName: products['seller-sku'],
                            ProductDesc: products['item-name'],
                            SellerSKU: products['seller-sku'],
                            Principal: products.price,
                            PostedDate: date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear(),
                            ASIN: products.asin1,
                            AvailableQuantity: products.quantity,
                            buycost: "",
                            Units: 1,
                            userid: item._id,
                            accessKeyId: item.accessKeyId,
                            accessSecret: item.accessSecret
                        });

                        amznModel.save(((error) => {
                            if (error) {
                                console.log(error);
                            }
                            console.log('Products saved successfully');
                        }));
                    });
                });
            }

            updateCharges(item);
        }

        async.waterfall([
            promise1,
            promise2,
            promise3,
            promise4
        ], (error) => {
            if (error) {
                console.log(error);
            }
        })
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var updateCharges = async (item) => {

    const orderData = await AmazonProductsSchema.find({});

    orderData.forEach((amazonData, index) => {

        const amazonMws = require('./../../../lib/amazon-mws')(amazonData.accessKeyId, amazonData.accessSecret);

        amazonMws.products.search({
            'Version': '2011-10-01',
            'Action': 'GetMyPriceForSKU',
            'SellerId': item.SellerID,
            'MWSAuthToken': item.MwsToken,
            'MarketplaceId': item.Marketplace,
            'SellerSKUList.SellerSKU': amazonData.SellerSKU
        }, function (error, response) {

            if (error) {
                // console.log('Errro while fetching shipping charges! ', error);
                console.log('Error while fetching shipping charges! ', error);
            }

            if (response !== null && response !== undefined) {

                if (Object.entries(response).length === 0 && response.constructor === Object) {
                    // console.log('Shipping Charges Response is null');
                } else {
                    if (response.Product !== null && response.Product !== undefined) {
                        if (Object.entries(response.Product).length === 0 && response.Product.constructor === Object) {
                            // console.log('Product Response is null');
                        } else {
                            if (response.Product.Offers !== null && response.Product.Offers !== undefined) {
                                if (Object.entries(response.Product.Offers).length === 0 && response.Product.Offers.constructor === Object) {
                                    // console.log('Offers Response is null');
                                } else {
                                    if (response.Product.Offers.Offer !== null && response.Product.Offers.Offer !== undefined) {
                                        if (Object.entries(response.Product.Offers.Offer).length === 0 && response.Product.Offers.Offer.constructor === Object) {
                                            // console.log('Offer Response is null');
                                        } else {
                                            if (response.Product.Offers.Offer.BuyingPrice !== null && response.Product.Offers.Offer.BuyingPrice !== undefined) {
                                                if (Object.entries(response.Product.Offers.Offer.BuyingPrice).length === 0 && response.Product.Offers.Offer.BuyingPrice.constructor === Object) {
                                                    // console.log('Buying Price Response is null');
                                                } else {
                                                    if (response.Product.Offers.Offer.BuyingPrice.Shipping !== null && response.Product.Offers.Offer.BuyingPrice.Shipping !== undefined) {
                                                        if (Object.entries(response.Product.Offers.Offer.BuyingPrice.Shipping).length === 0 && response.Product.Offers.Offer.BuyingPrice.Shipping.constructor === Object) {
                                                            // console.log('Shipping Price Response is null');
                                                        } else {
                                                            if (response.Product.Offers.Offer.BuyingPrice.Shipping.Amount !== null && response.Product.Offers.Offer.BuyingPrice.Shipping.Amount !== undefined) {
                                                                if (Object.entries(response.Product.Offers.Offer.BuyingPrice.Shipping.Amount).length === 0 && response.Product.Offers.Offer.BuyingPrice.Shipping.Amount.constructor === Object) {
                                                                    // console.log('Shipping Amount Response is null');
                                                                } else {

                                                                    AmazonProductsSchema.update({ 'SellerSKU': amazonData.SellerSKU },
                                                                        { $set: { 'ShippingCharge': response.Product.Offers.Offer.BuyingPrice.Shipping.Amount } }, (err) => {
                                                                            if (err) {
                                                                                console.log(err);
                                                                            }
                                                                            console.log('Shipping Charges have been added!');


                                                                        });
                                                                }

                                                            } else {
                                                                // console.log('Null/Undefined Shipping Amount Response.');
                                                            }
                                                        }
                                                    } else {
                                                        // console.log('Null/Undefined Shipping Charges Response.');
                                                    }
                                                }
                                            } else {
                                                // console.log('Null/Undefined Buying Price Response.');
                                            }
                                        }
                                    } else {
                                        // console.log('Null/Undefined Offer Response.');
                                    }
                                }
                            } else {
                                // console.log('Null/Undefined Offers Response.');
                            }
                        }
                    } else {
                        // console.log('Null/Undefined Product Response.');
                    }
                }
            } else {
                // console.log('Null/Undefined Shipping Charges Response.');
            }
        });
    });
    updateFees(item);
}

var updateFees = async (item) => {

    console.log('testing the required item ====> ', item);

    await sleep(50000)
    const productsData = await AmazonProductsSchema.find({});

    await productsData.forEach((amazonData, index) => {
        //console.log('fees----', amazonData);

        amazonMws.products.search({
            'Version': '2011-10-01',
            'Action': 'GetMyFeesEstimate',
            'SellerId': item.SellerID,
            'AWSAccessKeyId': amazonData.accessKeyId,
            'Secret Key': amazonData.accessSecret,
            'MWSAuthToken': item.MwsToken,
            'FeesEstimateRequestList.FeesEstimateRequest.1.MarketplaceId': item.Marketplace,
            'FeesEstimateRequestList.FeesEstimateRequest.1.IdType': 'SellerSKU',
            'FeesEstimateRequestList.FeesEstimateRequest.1.IdValue': amazonData.SellerSKU,
            'FeesEstimateRequestList.FeesEstimateRequest.1.IsAmazonFulfilled': 'true',
            'FeesEstimateRequestList.FeesEstimateRequest.1.Identifier': 'prod',
            'FeesEstimateRequestList.FeesEstimateRequest.1.PriceToEstimateFees.ListingPrice.Amount': amazonData.Principal,
            'FeesEstimateRequestList.FeesEstimateRequest.1.PriceToEstimateFees.ListingPrice.CurrencyCode': 'USD',
            'FeesEstimateRequestList.FeesEstimateRequest.1.PriceToEstimateFees.Shipping.Amount': amazonData.ShippingCharge,
            'FeesEstimateRequestList.FeesEstimateRequest.1.PriceToEstimateFees.Shipping.CurrencyCode': 'USD',
            'FeesEstimateRequestList.FeesEstimateRequest.1.PriceToEstimateFees.Points.PointsNumber': '0',
            'FeesEstimateRequestList.FeesEstimateRequest.1.PriceToEstimateFees.Points.PointsMonetaryValue.Amount': '0',
            'FeesEstimateRequestList.FeesEstimateRequest.1.PriceToEstimateFees.Points.PointsMonetaryValue.CurrencyCode': 'USD'

        }, function (error, response) {
            if (error) {
                console.log('error while fetching product fees ==> ', error);
                return;
            }

            if (response !== null && response !== undefined) {
                if (Object.entries(response).length === 0 && response.constructor === Object) {
                    // console.log('Response is null');
                } else {
                    if (response.FeesEstimateResultList !== null && response.FeesEstimateResultList !== undefined) {
                        if (Object.entries(response.FeesEstimateResultList).length === 0 && response.FeesEstimateResultList.constructor === Object) {
                            // console.log('Fees Estimate Result List is null');
                        } else {
                            if (response.FeesEstimateResultList.FeesEstimateResult !== null && response.FeesEstimateResultList.FeesEstimateResult !== undefined) {
                                if (Object.entries(response.FeesEstimateResultList.FeesEstimateResult).length === 0 && response.FeesEstimateResultList.FeesEstimateResult.constructor === Object) {
                                    // console.log('Fees Estimate Result is null');
                                } else {
                                    if (response.FeesEstimateResultList.FeesEstimateResult.FeesEstimate !== null && response.FeesEstimateResultList.FeesEstimateResult.FeesEstimate !== undefined) {
                                        if (Object.entries(response.FeesEstimateResultList.FeesEstimateResult.FeesEstimate).length === 0 && response.FeesEstimateResultList.FeesEstimateResult.FeesEstimate.constructor === Object) {
                                            // console.log('Fees Estimate is null');
                                        } else {
                                            if (response.FeesEstimateResultList.FeesEstimateResult.FeesEstimate.FeeDetailList !== null && response.FeesEstimateResultList.FeesEstimateResult.FeesEstimate.FeeDetailList !== undefined) {
                                                if (Object.entries(response.FeesEstimateResultList.FeesEstimateResult.FeesEstimate.FeeDetailList).length === 0 && response.FeesEstimateResultList.FeesEstimateResult.FeesEstimate.FeeDetailList.constructor === Object) {
                                                    // console.log('Fee Detail List is null');
                                                } else {
                                                    console.log('amazonData----', amazonData);
                                                    var ref_fee = response.FeesEstimateResultList.FeesEstimateResult.FeesEstimate.FeeDetailList.FeeDetail[0].FeeAmount.Amount;
                                                    var fba_fee = response.FeesEstimateResultList.FeesEstimateResult.FeesEstimate.FeeDetailList.FeeDetail[3].FeeAmount.Amount;
                                                    var currency_live = response.FeesEstimateResultList.FeesEstimateResult.FeesEstimate.FeeDetailList.FeeDetail[3].FeeAmount.CurrencyCode;
                                                    var productCost = parseFloat(amazonData.Units * amazonData.Principal);
                                                    var productCostCurrency = currency_live;
                                                    var feeTotal1 = parseFloat(amazonData.sampleFee) + parseFloat(amazonData.setupFee) + parseFloat(amazonData.inspectionFee) + parseFloat(amazonData.miscFee);
                                                    var feeTotal = ((feeTotal1 == NaN) || (feeTotal1 = NaN)) ? feeTotal1 : 0;
                                                    var feeTotalCurrency = currency_live;
                                                    var orderAndStagingCost = parseFloat(productCost) + parseFloat(feeTotal);
                                                    var orderAndStagingFeeCurrency = currency_live;
                                                    var shippingTotal = parseFloat(amazonData.Units * amazonData.ShippingCharge);
                                                    var shippingTotalCurrency = currency_live;
                                                    var landedOrder = (parseFloat(orderAndStagingCost) + parseFloat(shippingTotal)).toFixed(2);
                                                    var landedOrderCurrency = currency_live;
                                                    var landedAvgCost = (parseFloat(landedOrder / amazonData.Units)).toFixed(2);
                                                    var landedAvgCostCurrency = currency_live;
                                                    var fulfilledUnitCost1 = (parseFloat(landedAvgCost) + parseFloat(ref_fee) + parseFloat(fba_fee)).toFixed(2);
                                                    var fulfilledUnitCost = (fulfilledUnitCost1 != NaN && fulfilledUnitCost1 != null && fulfilledUnitCost1 != undefined)? fulfilledUnitCost1 : 0;
                                                    var fulfilledUnitCostCurrency = currency_live;
                                                    var amazonFeePerOrder = (amazonData.Units * (parseFloat(ref_fee) + parseFloat(fba_fee))).toFixed(2);
                                                    var amazonFeePerOrderCurrency = currency_live;
                                                    console.log('productCost----', productCost);
                                                    console.log('feeTotal----', feeTotal);
                                                    console.log('orderAndStagingCost----', orderAndStagingCost);
                                                    console.log('shippingTotal----', shippingTotal);
                                                    console.log('landedOrder----', landedOrder);
                                                    console.log('landedAvgCost----', landedAvgCost);
                                                    console.log('fulfilledUnitCost----', fulfilledUnitCost);
                                                    console.log('amazonFeePerOrder----', amazonFeePerOrder);

                                                    AmazonProductsSchema.update({ 'SellerSKU': amazonData.SellerSKU },
                                                        {
                                                            $set: {
                                                                'FBA': fba_fee,
                                                                'FBACurrency': currency_live,
                                                                'ReferralFee': ref_fee,
                                                                'ReferralFeeCurrency': response.FeesEstimateResultList.FeesEstimateResult.FeesEstimate.FeeDetailList.FeeDetail[0].FeeAmount.CurrencyCode,
                                                                'productCost': productCost,
                                                                'productCostCurrency': productCostCurrency,
                                                                'shippingTotal': shippingTotal,
                                                                'shippingTotalCurrency': shippingTotalCurrency,
                                                                'amznFeePerOrder': amazonFeePerOrder,
                                                                'fulfilledUnitCost': fulfilledUnitCost,
                                                                'fulfilledUnitCostCurrency': fulfilledUnitCostCurrency,
                                                                'amznFeePerOrderCurrency': amazonFeePerOrderCurrency
                                                            }
                                                        }, (err) => {
                                                            if (err) {
                                                                console.log(err);
                                                                // console.log(err);
                                                            }
                                                            console.log('Fee data has been updates.');
                                                        });
                                                }
                                            } else {
                                                // console.log('Null/Undefined Fee Detail List response.');
                                            }
                                        }
                                    } else {
                                        // console.log('Null/Undefined Fees Estimate response.');
                                    }
                                }
                            } else {
                                // console.log('Null/Undefined Fees Estimate Result response.');
                            }
                        }
                    } else {
                        // console.log('Null/Undefined Fees Estimate Result List response.');
                    }
                }
            } else {
                // console.log('Null/Undefined response.');
            }
        });
    });
}