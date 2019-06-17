"use strict";
const async = require('async');
var _ = require('lodash');
var AmazonProductsSchema = require('./../../../models/amazonProducts');
const config = require('config');
const accessKey = config.get('MWS_ACCESS_KEY');
const accessSecret = config.get('MWS_ACCESS_SECRET');
const amazonMws = require('./../../../lib/amazon-mws')(accessKey, accessSecret);
var arrayOne = [];
var arrayTwo = [];

module.exports.fetchAmazonProductFees = (req, res, next) => {
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
            SellerId: req.session.SellerID,
            MWSAuthToken: req.session.MWSAuthToken,
            ReportType: REPORT_TYPE,
            MarketplaceId: req.session.Marketplace,
        }, (error, response) => {
            if (error) {
                reject(error);
            }
            ReportID = response.ResponseMetadata.RequestId;
            listAllOrdersCallback(null, ReportID);
        });
    }

    async function promise2(ReportID, listOrderItemsCallback) {
        //console.log('ReportID---', ReportID);
        amazonMws.reports.search({
            Version: '2009-01-01',
            Action: 'GetReportRequestList',
            SellerId: req.session.SellerID,
            MWSAuthToken: req.session.MWSAuthToken,
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
                'AWSAccessKeyId': accessKey,
                'SellerId': req.session.SellerID,
                'MWSAuthToken': req.session.MWSAuthToken,
                'Secret Key': accessSecret,
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

                //console.log('arrayTwo-----', arrayTwo);
                HAS_NEXT = response.hasNext;
            });
        }
        listOrderItems12Callback(null, arrayTwo);
    }

    async function promise4(arrayTwo, listOrderItems1234Callback) {
        //console.log('arrayTwo------', arrayTwo);
        var concatArray = [];
        var finalArray = [];
        var skuArray = [];

        concatArray = arrayOne.concat(arrayTwo);

        finalArray = _.map(
            _.uniq(
                _.map(concatArray, obj => JSON.stringify(obj)),
            ),
            obj => JSON.parse(obj),
        );

        console.log('finalArray---------', finalArray);

        finalArray.forEach((item, index) => {

        amazonMws.reports.search({
                Version: '2009-01-01',
                Action: 'GetReport',
                SellerId: req.session.SellerID,
                MWSAuthToken: req.session.MWSAuthToken,
                ReportId: item,
            }, (error, response) => {

                if (error) {
                    console.log('error while using report ID++++', error);
                    return;
                }
                console.log('response.data---------', response.data);

                response.data.map((products, keys) => {

                    var date = new Date(products['open-date']);

                    const amznModel = new AmazonProductsSchema({
                        //ProductName: 'rexweb',
                        // ProductDesc: products['item-name'],
                        // SellerSKU: products['seller-sku'],
                        // Principal: products.price,
                        // PostedDate: date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear(),
                        ASIN: products.asin1,
                        // AvailableQuantity: products.quantity,
                        // buycost: "",
                        // Units: 1
                    });

                    amznModel.save(((error) => {
                        if (error) {
                            console.log(error);
                        }
                        console.log('Products saved successfully');
                    }));
                });
            });
        });
        console.log('HEYYYYYYYYYYYYYYY' );

        listOrderItems1234Callback(null, 'Products saved successfully', listOrderItems1234Callback);
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
}