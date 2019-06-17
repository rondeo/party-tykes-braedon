"use strict";
var _ = require('lodash');
var refund = require('./../../../models/refunds');
const config = require('config');
const format = require('date-format');
const accessKey = config.get('MWS_ACCESS_KEY');
const accessSecret = config.get('MWS_ACCESS_SECRET');
const amazonMws = require('./../../../lib/amazon-mws')(accessKey, accessSecret);
var async = require('async');
var dataArray = [];

module.exports.fetchAmazonReports = (req, res, next) => {

    let ReportID = '';
   var NextToken = '';
   var REPORT_TYPE = '_GET_DATE_RANGE_FINANCIAL_TRANSACTION_DATA_';
   var REPORT_IDS_1 = [];
   var REPORT_IDS = [];
   var REFINED_REPORT_IDS = [];
   var REFINED_REPORT_IDS_2 = [];
   var FINAL_REPORT_IDS = [];
   var hasNext = ''
   var HAS_NEXT = true;

async function getReportID(getReportIdCallback) {

   await amazonMws.reports.submit({
       Version: '2009-01-01',
       Action: 'RequestReport',
       SellerId: req.session.SellerID,
       MWSAuthToken: req.session.MwsToken,
       ReportType: REPORT_TYPE,
       MarketplaceId: req.session.Marketplace,
   }, (error, response) => {
       if (error) {
           console.log('error ', error);
           return;
       }
       ReportID = response.ResponseMetadata.RequestId;
       console.log('ReportID----------', ReportID);

       amazonMws.reports.search({
           Version: '2009-01-01',
           Action: 'GetReportRequestList',
           SellerId: req.session.SellerID,
           MWSAuthToken: req.session.MwsToken,
           ReportRequestId: ReportID,
       }, (error, response) => {
           if (error) {
               console.log('error ', error);
               return;
           }
           NextToken = response.NextToken;

           hasNext = response.HasNext;

           response.ReportRequestInfo.map((reportdata, index) => {

               if (reportdata.ReportType == REPORT_TYPE) {
                   if (reportdata.GeneratedReportId !== undefined) {
                       console.log('reportdata.GeneratedReportId---', reportdata.GeneratedReportId);
                       REPORT_IDS_1.push(reportdata.GeneratedReportId);
                   }
               }
           });
           console.log('REPORT_IDS_1---', REPORT_IDS_1);

           REPORT_IDS = _.map(
               _.uniq(
                   _.map(REPORT_IDS_1, obj => JSON.stringify(obj)),
               ),
               obj => JSON.parse(obj),
           );
           console.log('REPORT_IDS--', REPORT_IDS);

           REPORT_IDS.map((ReportIds, index) => {
               amazonMws.reports.search({
                   Version: '2009-01-01',
                   Action: 'GetReport',
                   SellerId: req.session.SellerID,
                   MWSAuthToken: req.session.MwsToken,
                   ReportId: ReportIds,
               }, (error, response) => {

                   console.log('response---', response);
                   if (error) {
                       console.log('error ', error);
                       return;
                   }
               });
           });

       });

   });

   //getReportIdCallback(null, ReportID);
}

   async.waterfall([ 
       getReportID
   ], (error) => {
       if (error) {
           console.log(error);
       }
   })
}
