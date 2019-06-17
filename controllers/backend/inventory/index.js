var async = require('async');
const config = require('config');
const accessKey = config.get('MWS_ACCESS_KEY');
const accessSecret = config.get('MWS_ACCESS_SECRET');
const amazonMws = require('./../../../lib/amazon-mws')(accessKey, accessSecret);

var dataArray = [];

module.exports.fetchAfnData = (req, res, next) => {

    var ReportID = [];

    function requestReport(requestReportCallback) {

        amazonMws.reports.submit({
            'Version': '2009-01-01',
            'Action': 'RequestReport',
            'SellerId': 'AOD4LKCG1A3T2',
            'MWSAuthToken': 'amzn.mws.a6b277bc-540c-ea9f-4abf-d1111c560568',
            'ReportType': '_GET_AFN_INVENTORY_DATA_'
        }, function (error, response) {
            if (error) {
                console.log('error ', error);
            }
        });

        requestReportCallback();
    }

    function checkReportStatus(checkReportStatusCallback) {

        amazonMws.reports.search({
            'Version': '2009-01-01',
            'Action': 'GetReportRequestList',
            'SellerId': 'AOD4LKCG1A3T2',
            'MWSAuthToken': 'amzn.mws.a6b277bc-540c-ea9f-4abf-d1111c560568'

        }, function (error, response) {
            if (error) {
                console.log('error ', error);
            }

            response.ReportRequestInfo.map((resp, key) => {
                if (resp.ReportType == '_GET_AFN_INVENTORY_DATA_') {
                    if (resp.ReportProcessingStatus == '_DONE_') {

                        ReportID.push({
                            'id': resp.GeneratedReportId
                        })
                    }
                }
            })
            checkReportStatusCallback(null, ReportID);
        });
    }


    function getData(ReportID, getDataCallback) {

        console.log('Payload received => ', ReportID);

        ReportID.forEach((report, index) => {
            amazonMws.reports.search({
                'Version': '2009-01-01',
                'Action': 'GetReport',
                'SellerId': 'AOD4LKCG1A3T2',
                'MWSAuthToken': 'amzn.mws.a6b277bc-540c-ea9f-4abf-d1111c560568',
                'ReportId': report.id
            }, function (error, response) {
                if (error) {
                    console.log('error ', error);
                    return;
                }

                response.data.forEach((item, key) => {

                    dataArray.push({
                        'sellerSKU': item['seller-sku'],
                        'fulfimentChannelSKU': item['fulfillment-channel-sku'],
                        'ASIN': item.asin,
                        'itemCondition': item['condition-type'],
                        'warehouseConditionCode': item['Warehouse-Condition-code'],
                        'availableQuantity': item['Quantity Available']
                    })
                })
                res.render('inventory/afnData', { request_url: 'inventory_search', user: req.session.name, email: req.session.email, role: req.session.role, dataArray: dataArray })
            });
        })

        getDataCallback()
    }

    async.waterfall([
        requestReport,
        checkReportStatus,
        getData
    ], (err) => {
        if (err) throw err;
    })
}