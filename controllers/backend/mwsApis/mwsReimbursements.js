const mongoose = require('mongoose');
const User = mongoose.model('User');
const config = require('config');
var async = require('async');
var format = require('date-format');
var ReimbursementsSchema = require('./../../../models/reimbursements');
const accessKey = config.get('MWS_ACCESS_KEY');
const accessSecret = config.get('MWS_ACCESS_SECRET');
const amazonMws = require('./../../../lib/amazon-mws')(accessKey, accessSecret);

module.exports.fetchAmazonReimbursements = async(req, res, next) => {
    var myData = await User.find({'isMwsVerified': true});
    var today = new Date();
    var event = new Date();
    var prev_days = event.setDate(event.getDate() - 2);
    var StartDate = new Date(prev_days);

    myData.forEach((item, index) => {

    // Function to retrieve reimbursements
    var reimbursements = function () {
        amazonMws.reports.submit({
            'Version': '2009-01-01',
            'Action': 'RequestReport',
            'SellerId': item.SellerID,
            'ReportType': '_GET_FBA_REIMBURSEMENTS_DATA_',
            'StartDate': StartDate,
            'EndDate': today
        }, function (error, response) {
            if (error) {
                console.log('error--1', error);
                return;
            }

            var ReportRequestId = response.ReportRequestInfo.ReportRequestId;
            if(ReportRequestId){
                amazonMws.reports.search({
                    'Version': '2009-01-01',
                    'Action': 'GetReportRequestList',
                    'ReportProcessingStatusList.Status.1': '_DONE_',
                    'ReportRequestIdList.Id.1': ReportRequestId,
                    'SellerId': item.SellerID,
                    'Marketplace': item.Marketplace
                }, function (error, response1) {
                    if (error) {
                        console.log('error---2', error);
                        return;
                    }

                    var ReportRequestId2 = response.ReportRequestInfo.GeneratedReportId;
                    if(ReportRequestId2){
                        amazonMws.reports.search({
                            'Version': '2009-01-01',
                            'Action': 'GetReport',
                            'ReportId': ReportRequestId2,
                            'SellerId': item.SellerID
                        }, function (error, response2) {
                            if (error) {
                                console.log('error---3', error);
                                return;
                            }
                            var reimbursements = response2.data;

                            if (response2) {
                                for (var i = 1; i < reimbursements.length; i++) {
                                    const reimbursementsData = ReimbursementsSchema({
                                        userid: item._id,
                                        approvaldate: (reimbursements[i]['approval-date'] != undefined && reimbursements[i]['approval-date'] != "") ? (reimbursements[i]['approval-date']) : "",
                                        amazonOrderId: reimbursements[i]['amazon-order-id'],
                                        sku: reimbursements[i].sku,
                                        productname: reimbursements[i]['product-name'],
                                        reimbursementId: reimbursements[i]['reimbursement-id'],
                                        amountperUnit: reimbursements[i]['currency-unit'],
                                        currencyUnit: reimbursements[i]['currency-unit'],
                                        quantityReimbursedCash: reimbursements[i]['quantity-reimbursed-cash'],
                                        quantityReimbursedInventory: reimbursements[i]['quantity-reimbursed-inventory'],
                                        quantityReimbursedTotal: reimbursements[i]['quantity-reimbursed-total'],
                                        reason: reimbursements[i]['reason'],
                                    });
                                    reimbursementsData.save(((error) => {
                                        if (error) {
                                            console.log(error);
                                        }
                                        console.log('reimbursement saved !!!');
                                    }))
                                }
                                res.send('reimbursement saved---');
                            }
                            else{
                                console.log('response is null');
                            }

                        });
                    }
                    else{
                        console.log('generated id is null ');
                        return;
                    }

                });
            }
            else{
                console.log('response is null');
                return;
            }

        });
    };
    reimbursements();
    })
}

