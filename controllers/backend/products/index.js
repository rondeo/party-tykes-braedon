const uuid = require('uuid/v4');
var fse = require('fs-extra');
var fs = require('fs');
var moment = require('moment');
const format = require('date-format');
var AmazonProductsSchema = require('./../../../models/amazonProducts');
var ReimbursementsSchema = require('./../../../models/reimbursements');
var Order = require('./../../../models/amazonOrders');
const config = require('config');
var _ = require('lodash');
var async = require('async');
var Decimal = require('decimal');
var events = require("events");
const mongoose = require('mongoose');
const User = mongoose.model('User');
var eventsEmitter = new events.EventEmitter();
var counter = 0;
var edit_counter = 0;
// Arrays to Deal with Product Stocks Data.
var arrayOne = [];
var arrayTwo = [];
var sell_sku = [];
var finalarr = [];

//Controller to display general information of the products.
module.exports.listProducts = (req, res) => {

    // Initializing Promise.
    var promise1 = new Promise((resolve, reject) => {
        const data = AmazonProductsSchema.find({});
        resolve(data);
    });

    // Resolving Promise & rendering data.
    promise1.then((products) => {
        res.render('products/list-products', {
            products,
            moment: moment,
            request_url: 'product_list',
            user: req.session.name,
            email: req.session.email,
            role: req.session.role
        });
    });
}

// Controller to check charges associated to products.
module.exports.checkCharges = (req, res) => {

    // Initializing promise.
    var promise = new Promise((resolve, reject) => {
        const data = AmazonProductsSchema.find({});
        resolve(data);
    });

    // Resolving promise & rendering data.
    promise.then((products) => {
        res.render('products/product-charges', {
            products,
            request_url: 'product_charges',
            user: req.session.name,
            email: req.session.email,
            role: req.session.role
        });
    });
}

// Controller for returning fees associated with each product.
module.exports.checkFees = (req, res) => {

    // Initializing promise.
    var promise = new Promise((resolve, reject) => {

        const data = AmazonProductsSchema.find({});

        resolve(data);

    });

    // Resolving promise & rendering the data.
    promise.then((products) => {
        res.render('products/product-fees', {
            products,
            request_url: 'product_fees',
            user: req.session.name,
            email: req.session.email,
            role: req.session.role
        });
    });
}

// Controller for product stocks.
module.exports.checkStock = (req, res) => {
    const accessKey = req.session.AccessKey;
    const accessSecret = req.session.AccessSecret;
    var amazonMws = require('amazon-mws')(accessKey, accessSecret);

    // Setting up events.
    eventsEmitter.on('readDB', readDatabase);
    eventsEmitter.on('getDbData', getDbData);
    eventsEmitter.on('sendDbData', sendDbData);
    eventsEmitter.on('compile', compileData);
    eventsEmitter.on('render', renderData);

    // Event Initialization.
    eventsEmitter.emit('readDB');

    // Function to get list of products.
    async function readDatabase() {

        const data = await AmazonProductsSchema.find({});

        // Firing up next event.
        eventsEmitter.emit('getDbData', data);
    }

    // Function 1 call.
    readDatabase

    // Function to store required orders data in an array.
    function getDbData(data) {

        data.forEach((prod, index) => {

            arrayOne.push({
                'PostedDate': prod.PostedDate,
                'ASIN': prod.ASIN,
                'SellerSKU': prod.SellerSKU,
                'ProductDesc': prod.ProductDesc
            });

            sell_sku.push(prod.SellerSKU);

        });

        // Firing up next event.
        eventsEmitter.emit('sendDbData', sell_sku);
    }

    // Function 2 call.
    getDbData

    // Function to fetch stock data from MWS api.
    async function sendDbData(data) {

        await amazonMws.fulfillmentInventory.search({
            'Version': '2010-10-01',
            'Action': 'ListInventorySupply',
            'SellerId': 'AOD4LKCG1A3T2',
            'MWSAuthToken': 'amzn.mws.a6b277bc-540c-ea9f-4abf-d1111c560568',
            'MarketplaceId': 'ATVPDKIKX0DER',
            'SellerSkus.member': data
        }, function (error, response) {

            if (error) {
                console.log('error ', error);
            }

            if (response !== null && response !== undefined) {
                if (Object.entries(response).length === 0 && response.constructor === Object) {
                    console.log('Response is null');
                } else {
                    if (response.InventorySupplyList !== null && response.InventorySupplyList !== undefined) {
                        if (Object.entries(response.InventorySupplyList).length === 0 && response.InventorySupplyList.constructor === Object) {
                            console.log('Response.InventorySupplyList is null');
                        } else {
                            if (response.InventorySupplyList.member !== null && response.InventorySupplyList.member !== undefined) {

                                // If there are multiple products.
                                if (Array.isArray(response.InventorySupplyList.member)) {

                                    response.InventorySupplyList.member.forEach((dataa, indx) => {

                                        arrayTwo.push({
                                            'Condition': dataa.Condition ? dataa.Condition : '',
                                            'FNSKU': dataa.FNSKU ? dataa.FNSKU : '',
                                            'TotalSupplyQuantity': dataa.TotalSupplyQuantity ? dataa.TotalSupplyQuantity : '',
                                            'inStockQuantity': dataa.InStockSupplyQuantity ? dataa.InStockSupplyQuantity : '',
                                            'Availability': dataa.EarliestAvailability ? dataa.EarliestAvailability.TimepointType : '',
                                            'SellerSKU': dataa.SellerSKU ? dataa.SellerSKU : ''
                                        });
                                    });

                                    // If there's a single product.
                                } else {

                                    arrayTwo.push({
                                        'Condition': response.InventorySupplyList.member.Condition ? response.InventorySupplyList.member.Condition : '',
                                        'FNSKU': response.InventorySupplyList.member.FNSKU ? response.InventorySupplyList.member.FNSKU : '',
                                        'TotalSupplyQuantity': response.InventorySupplyList.member.TotalSupplyQuantity ? response.InventorySupplyList.member.TotalSupplyQuantity : '',
                                        'inStockQuantity': response.InventorySupplyList.member.InStockSupplyQuantity ? response.InventorySupplyList.member.InStockSupplyQuantity : '',
                                        'Availability': response.InventorySupplyList.member.EarliestAvailability ? response.InventorySupplyList.member.EarliestAvailability.TimepointType : '',
                                        'SellerSKU': response.InventorySupplyList.member.SellerSKU ? response.InventorySupplyList.member.SellerSKU : ''
                                    });
                                }

                            } else {
                                console.log('Null/Undefined response.InventorySupplyList.member');
                            }
                        }
                    } else {
                        console.log('Null/Undefined response.InventorySupplyList');
                    }
                }
            } else {
                console.log('Null/Undefined response.');
            }

            // Firing up next event.
            eventsEmitter.emit('compile');

        });
    }

    // Function 3 call.
    sendDbData

    // Function to integrate data from both arrays.
    function compileData() {

        // Merging data on basis of a common key i.e SellerSKU.
        finalarr = _.map(arrayOne, (item) => {
            return _.extend(item, _.find(arrayTwo, { SellerSKU: item.SellerSKU }));
        });

        // Firing up next event.
        eventsEmitter.emit('render', finalarr);
    }

    // Function 4 call.
    compileData

    // Function to render the required products data.
    function renderData(products) {

        res.render('products/product-stock', {
            products,
            moment: moment,
            request_url: 'product_stock',
            user: req.session.name,
            email: req.session.email,
            role: req.session.role
        });

    }

    // Function 5 call.
    renderData
}

// module.exports.showProducts = async (req, res, next) => {

//     const productsData = await AmazonProductsSchema.find({});

//     res.render('products/show-products', {
//         productsData,
//         request_url: 'manage_products',
//         user: req.session.name,
//         email: req.session.email,
//         role: req.session.role
//     });

// }

// Controller for rendering a new product page.
module.exports.addProduct = (req, res, next) => {
    res.render('products/add-product', {
        counter: counter,
        request_url: 'add_product',
        user: req.session.name,
        email: req.session.email,
        role: req.session.role,
        user_id: req.session.userid
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Controller for adding a new product.
module.exports.postProduct = async(req, res, next) => {
    var sellerid = req.session.SellerID;
    var asin = req.body.asin;
    var sku = req.body.sku;
    var title = req.body.title;
    var description = req.body.description;
    var brand = req.body.brand;
    var price = req.body.price;
    var manufacturer = req.body.manufacturer;
    var itemtype = req.body.itemtype;
    var date = format('dd-MM-yyyy', new Date());
    var userid = req.session.userid;
    var productname = req.body.productname;

    const amzn = AmazonProductsSchema({
        userid: userid,
        ProductName: sku,
        ProductDesc: description,  
        PostedDate: date,
        brand: brand,
        title: title,
        SellerSKU: sku,
        ASIN: asin
    });

    amzn.save(((error) => {
        if (error) {
            console.log(error);
        }
        req.flash('success_msg', 'Product added successfully !');
    }))

//     var content = '<AmazonEnvelope xmlns:xsi="http:www.w3.org/2001/XMLSchema-instance">'
//        +'<Header>'
//          +'<DocumentVersion>1.01</DocumentVersion>'
//          +'<MerchantIdentifier>MY_IDENTIFIER_8262</MerchantIdentifier>'
//        +'</Header>'
//        +'<MessageType>Product</MessageType>'
//        +'<PurgeAndReplace>false</PurgeAndReplace>'
//        +'<Message>'
//          +'<MessageID>1</MessageID>'
//          +'<OperationType>Update</OperationType>'
//          +'<Product>'
//            +'<SKU>'+sku+'</SKU>'
//            +'<StandardProductID>'
//              +'<Type>ASIN</Type>'
//              +'<Value>'+asin+'</Value>'
//            +'</StandardProductID>'
//            +'<DescriptionData>'
//              +'<Title>'+title+'</Title>'
//              +'<Brand>'+brand+'</Brand>'
//              +'<Description>'+description+'</Description>'
//              +'<MSRP currency="USD">'+price+'</MSRP>'
//            +'</DescriptionData>'
//          +'</Product>'
//        +'</Message>'
// +'</AmazonEnvelope>';

//     fs.writeFile('mwsFiles/file2.txt', content, function (err) {
//         if (err) throw err;
//         var FeedContent = fse.readFileSync('mwsFiles/file2.txt', 'UTF-8');
            
//             amazonMws.feeds.submit({
//                 'Version': '2009-01-01',
//                 'Action': 'SubmitFeed',
//                 'FeedType': '_POST_PRODUCT_DATA_',
//                 'FeedContent': FeedContent,
//                 'SellerId': req.session.SellerID,
//                 'MWSAuthToken': req.session.MwsToken
//             }, function (error, response) {
//                 if (error) {
//                     console.log('error ', error);
//                 }
//                 console.log('response--', response);
//                 counter++;
//                 res.redirect('/products/list-products');
//             });
//     });
}

// Controller for rendering the edit product screen.
module.exports.getEditProduct = async (req, res, next) => {

    const product = await AmazonProductsSchema.findById(req.params.id);

    res.render('products/edit-product', {
        product,
        counter: edit_counter,
        request_url: 'add_product',
        user: req.session.name,
        email: req.session.email,
        role: req.session.role
    });
}

// Controller for adding a new product.
module.exports.postEditProduct = (req, res, next) => {
    var sellerid = req.session.SellerID;
    var asin = req.body.asin;
    var sku = req.body.sku;
    var title = req.body.title;
    var description = req.body.description;
    var brand = req.body.brand;
    var price = req.body.price;
    var manufacturer = req.body.manufacturer;
    var itemtype = req.body.itemtype;
    var buycost = req.body.buycost;
    var product_id = req.params.id;

    var content = '<AmazonEnvelope xmlns:xsi="http:www.w3.org/2001/XMLSchema-instance">'
       +'<Header>'
         +'<DocumentVersion>1.01</DocumentVersion>'
         +'<MerchantIdentifier>MY_IDENTIFIER_8262</MerchantIdentifier>'
       +'</Header>'
       +'<MessageType>Product</MessageType>'
       +'<PurgeAndReplace>false</PurgeAndReplace>'
       +'<Message>'
         +'<MessageID>1</MessageID>'
         +'<OperationType>Update</OperationType>'
         +'<Product>'
           +'<SKU>'+sku+'</SKU>'
           +'<StandardProductID>'
             +'<Type>ASIN</Type>'
             +'<Value>'+asin+'</Value>'
           +'</StandardProductID>'
           +'<DescriptionData>'
             +'<Title>'+title+'</Title>'
             +'<Brand>'+brand+'</Brand>'
             +'<Description>'+description+'</Description>'
           +'</DescriptionData>'
         +'</Product>'
       +'</Message>'
    +'</AmazonEnvelope>';

    AmazonProductsSchema.update({ '_id':  product_id},{
        $set: {'buycost' : buycost,
               'title' : req.body.title,
               'ProductDesc' : req.body.description,
               'brand': req.body.brand
        }
    }, (err) => {
        if (err) {console.log(err);}
        Order.find({'idmatch': product_id}, function(err, data) {
            for(var i=0; i<data.length; i++){
                Order.update({'AmazonOrderID': data[i].AmazonOrderID},
                { $set: {'buycost': buycost}}, (err) => {
                    if (err) {console.log(err);}
                    console.log('updated...');
                    req.flash('success_msg', 'Product edited successfully!');
                    res.redirect('/products/list-products');
                });
            }
        });
    });

    // fs.writeFile('mwsFiles/file2.txt', content, function (err) {
    //     if (err) throw err;
    //     var FeedContent = fse.readFileSync('mwsFiles/file2.txt', 'UTF-8');
    //     console.log('counter', counter);
              
    //         amazonMws.feeds.submit({
    //             'Version': '2009-01-01',
    //             'Action': 'SubmitFeed',
    //             'FeedType': '_POST_PRODUCT_DATA_',
    //             'FeedContent': FeedContent,
    //             'SellerId': req.session.SellerID,
    //             'MWSAuthToken': req.session.MwsToken
    //         }, function (error, response) {
    //             if (error) {
    //                 console.log('error ', error);
    //             }
    //             console.log('response--', response);
    //             edit_counter++;
    //             counter++;
    //             req.flash('success_msg', 'Product edited successfully!');
    //             res.redirect('/products/list-products');
    //         });
    // });
}

//Controller for deleting a product from database.

module.exports.deleteProduct = (req, res, next) => {
    const accessKey = req.session.AccessKey;
    const accessSecret = req.session.AccessSecret;
    var amazonMws = require('amazon-mws')(accessKey, accessSecret);
    AmazonProductsSchema.findByIdAndRemove(req.params.id, (err) => {
        if (err) return next(err);

    });

    var sellerid = req.session.SellerID;
    var content = '<?xml version=“1.0” encoding=“UTF-8” standalone=“no”?>'
    +'<AmazonEnvelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="amzn-envelope.xsd">'
    +'<Header>'
    +'<DocumentVersion>1.01</DocumentVersion>'
    +'<MerchantIdentifier>'+sellerid+'</MerchantIdentifier>'
    +'</Header>'
    +'<MessageType>Product</MessageType>'
    +'<Message>'
    +'<MessageID>1</MessageID>'
    +'<OperationType>Delete</OperationType>'
    +'<Product>'
    +'<SKU>BDDS001</SKU>'
    +'</Product>'
    +'</Message>'
    +'</AmazonEnvelope>';

//     fs.writeFile('MWS/file3.txt', content, function (err) {
//         if (err) throw err;
//         var FeedContent = fse.readFileSync('MWS/file3.txt', 'UTF-8');
//         amazonMws.feeds.submit({
//             'Version': '2009-01-01',
//             'Action': 'SubmitFeed',
//             'FeedType': '_POST_PRODUCT_DATA_',
//             'FeedContent': FeedContent,
//             'SellerId': 'AOD4LKCG1A3T2',
//             'MWSAuthToken': 'amzn.mws.a6b277bc-540c-ea9f-4abf-d1111c560568',
//         }, function (error, response) {
//             if (error) {
//                 console.log('error ', error);
//                 return;
//             }
//             console.log('response-----', response);
//             res.redirect('/products/list-products');
//         });
//    });
    
}

//ControllerS for edit productfee
module.exports.getEditFee = async (req, res, next) => {
    const product = await AmazonProductsSchema.findById(req.params.id);
    // console.log("FINALPRO",product)
    res.render('products/edit-productfee', {
        product,
        request_url: 'edit_productfee',
        user: req.session.name,
        email: req.session.email,
        role: req.session.role
    });

}

//Controller for updating fee
module.exports.postEditFee = async (req, res, next) => {
    // console.log("BBOODDYY>>>", req.body)
    const accessKey = req.session.AccessKey;
    const accessSecret = req.session.AccessSecret;
    var amazonMws = require('amazon-mws')(accessKey, accessSecret);
    var productprice = req.body.productprice;
    var ShippingCharge = req.body.ShippingCharge;
    // console.log("SHIPPING", req.body.ShippingCharge);
    AmazonProductsSchema.findByIdAndUpdate(req.params.id, {
        Principal: productprice,
        ShippingCharge: ShippingCharge,

    }, (err) => {
        if (err) {
            console.log(err);
        }
        async function getFees() {
            const productsData = await AmazonProductsSchema.find({});

            productsData.forEach((amazonData, index) => {
                //console.log("AARRAAYY>>>",amazonData)
                amazonMws.products.search({
                    'Version': '2011-10-01',
                    'Action': 'GetMyFeesEstimate',
                    'SellerId': req.session.SellerID,
                    'AWSAccessKeyId': accessKey,
                    'Secret Key': accessSecret,
                    'MWSAuthToken': req.session.MWSAuthToken,
                    'FeesEstimateRequestList.FeesEstimateRequest.1.MarketplaceId': req.session.Marketplace,
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
                        // reject('error while fetching product fees ==> ', error);
                    }
                    // console.log("API_RES>>>>", response);
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

                                                            var ref_fee = response.FeesEstimateResultList.FeesEstimateResult.FeesEstimate.FeeDetailList.FeeDetail[0].FeeAmount.Amount;
                                                            console.log("FFEEEE>>>", ref_fee)
                                                            var fba_fee = response.FeesEstimateResultList.FeesEstimateResult.FeesEstimate.FeeDetailList.FeeDetail[3].FeeAmount.Amount;
                                                            console.log("fba_fee", fba_fee)
                                                            var currency_live = response.FeesEstimateResultList.FeesEstimateResult.FeesEstimate.FeeDetailList.FeeDetail[3].FeeAmount.CurrencyCode
                                                            console.log("Currency:", currency_live)
                                                            var productCost = amazonData.Units * amazonData.Principal;
                                                            console.log("PRODUCTCOST>>>>", productCost)
                                                            var shippingTotal = amazonData.Units * amazonData.ShippingCharge;
                                                            console.log("ShippingTotal", shippingTotal)
                                                            var amazonFeePerOrder = (amazonData.Units * (parseFloat(ref_fee) + parseFloat(fba_fee))).toFixed(2);
                                                            console.log("amazonFEEEE>>>", amazonFeePerOrder)

                                                            AmazonProductsSchema.update({ 'SellerSKU': amazonData.SellerSKU },
                                                                {
                                                                    $set: {
                                                                        'FBA': fba_fee,
                                                                        'FBACurrency': currency_live,
                                                                        'ReferralFee': ref_fee,
                                                                        'productCost': productCost,
                                                                        'shippingTotal': shippingTotal,
                                                                        'amznFeePerOrder': amazonFeePerOrder,

                                                                    }
                                                                }, (err) => {
                                                                    if (err) {

                                                                        console.log(err);
                                                                    }
                                                                    console.log('Fee data has been updated.');

                                                                });

                                                        }
                                                    } else {
                                                        console.log('Null/Undefined Fee Detail List response.');
                                                    }
                                                }
                                            } else {
                                                console.log('Null/Undefined Fees Estimate response.');
                                            }
                                        }
                                    } else {
                                        console.log('Null/Undefined Fees Estimate Result response.');
                                    }
                                }
                            } else {
                                console.log('Null/Undefined Fees Estimate Result List response.');
                            }
                        }
                    } else {
                        console.log('Null/Undefined response.');
                    }
                });
            });
        }

        getFees();

        req.flash('success_msg', 'Fee edited successfully !');
        console.log("hello")
        res.redirect('/products/check-fees');

    });

};




























// Controller for searching relevant products in a particular marketplace.
module.exports.searchProducts = (req, res, next) => {
    res.render('products/search-products', {
        request_url: 'product_search',
        user: req.session.name,
        email: req.session.email,
        role: req.session.role
    });
}

// Controller for showing the search product results as per relevancy (in a selected marketplace).
module.exports.showResults = async (req, res, next) => {
    const accessKey = req.session.AccessKey;
    const accessSecret = req.session.AccessSecret;
    var amazonMws = require('amazon-mws')(accessKey, accessSecret);
    var QUERY = '';
    QUERY = req.body.userQuery;
    var searchArray = [];

    await amazonMws.products.search({
        'Version': '2011-10-01',
        'Action': 'ListMatchingProducts',
        'SellerId': AOD4LKCG1A3T2,
        'MWSAuthToken': req.session.MwsToken,
        'MarketplaceId': 'ATVPDKIKX0DER',
        'Query': QUERY
    }, function (error, response) {
        if (error) {
            console.log('error products', error);
            return;
        }
        response.Products.Product.map((prod, indx) => {
            console.log("FINALLY", prod.SalesRankings.SalesRank[0].Rank)
            // console.log('YOYO',prod.AttributeSets.ItemAttributes.Title)

            if (prod.AttributeSets.ItemAttributes.ListPrice !== undefined) {

                searchArray.push({
                    'description': prod.AttributeSets.ItemAttributes.Title,
                    'brand': prod.AttributeSets.ItemAttributes.Brand,
                    'color': prod.AttributeSets.ItemAttributes.Color,
                    'label': prod.AttributeSets.ItemAttributes.Label,
                    'price': prod.AttributeSets.ItemAttributes.ListPrice.Amount,
                    'currency': prod.AttributeSets.ItemAttributes.ListPrice.CurrencyCode,
                    'model': prod.AttributeSets.ItemAttributes.Model,
                    'size': prod.AttributeSets.ItemAttributes.Size,
                    'quantity': prod.AttributeSets.ItemAttributes.NumberOfItems,
                    'image': prod.AttributeSets.ItemAttributes.SmallImage.URL,
                    'salesRank': prod.SalesRankings.SalesRank[0].Rank

                });
            }
        });
        res.render('products/show-results', {
            request_url: 'product_search',
            user: req.session.name,
            email: req.session.email,
            role: req.session.role,
            searchdata: searchArray,
            query: QUERY
        });
    });
}


// Get list of products for SKUs.
module.exports.getproductsforsku = async (req, res, next) => {
    const accessKey = req.session.AccessKey;
    const accessSecret = req.session.AccessSecret;
    var amazonMws = require('amazon-mws')(accessKey, accessSecret);
    const SKUID = req.params.id;
    console.log('IDDDDDDDDD', SKUID);
    amazonMws.products.search({
        'Version': '2011-10-01',
        'Action': 'GetMatchingProductForId',
        'SellerId': req.session.SellerID,
        'MWSAuthToken': req.session.MWSAuthToken,
        'MarketplaceId': req.session.Marketplace,
        'IdType': 'SellerSKU',
        'IdList.Id.1': SKUID,
    }, function (error, response) {
        if (error) {
            console.log('error products', error);
            return;
        }

        const Product = response.Products.Product.AttributeSets.ItemAttributes;

        const Brand = Product.Brand;
        const Color = Product.Color;
        const Label = Product.Label;
        const ProductGroup = Product.ProductGroup;
        const Publisher = Product.Publisher;
        const Title = Product.Title;
        const ProductTypeName = Product.ProductTypeName;
        const ListPrice = Product.ListPrice;
        const SmallImage = Product.SmallImage.URL;

        res.render('products/getproductsforsku', {
            SKUID: SKUID,
            SmallImage: SmallImage,
            ListPrice: ListPrice,
            ProductTypeName: ProductTypeName,
            Title: Title,
            ProductGroup: ProductGroup,
            Publisher: Publisher,
            Label: Label,
            Color: Color,
            Brand: Brand,
            request_url: 'getproductsforsku',
            user: req.session.name,
            email: req.session.email,
            role: req.session.role
        });
    });
}

//Controller for rendering profitability screen of a product.
module.exports.getProfitForProduct = async (req, res, next) => {
    const asin = req.params.id;
    const selling_price = '';
    const profitability = false;
    const productData = await AmazonProductsSchema.find({
        _id: asin
    });
    const fulfilledUnitCost = (productData[0].fulfilledUnitCost != undefined && productData[0].fulfilledUnitCost != null && productData[0].fulfilledUnitCost != '')?productData[0].fulfilledUnitCost:0;
    const fulfilledUnitCostCurrency = productData[0].fulfilledUnitCostCurrency;
    res.render('products/getProfitForProduct', {
        selling_price: selling_price,
        profitability: profitability,
        fulfilledUnitCost: fulfilledUnitCost,
        fulfilledUnitCostCurrency: fulfilledUnitCostCurrency,
        request_url: 'product_search',
        user: req.session.name,
        email: req.session.email,
        role: req.session.role
    });
}

// Controller for checking the profitability & returning profit/loss & their percentage.
module.exports.postProfitForProduct = async (req, res, next) => {
    const selling_price = req.body.selling_price;
    const asin = req.params.id;
    const profitability = true;
    const productData = await AmazonProductsSchema.find({
        _id: asin
    });
    console.log("DDAATTAAA",productData)
    const fulfilledUnitCost = (productData[0].fulfilledUnitCost != undefined && productData[0].fulfilledUnitCost != null && productData[0].fulfilledUnitCost != '')?productData[0].fulfilledUnitCost:0;
    const profit = (parseFloat(selling_price) - parseFloat(fulfilledUnitCost)).toFixed(2);
    const profitper = ((parseFloat(profit) / parseFloat(fulfilledUnitCost)) * 100).toFixed(2);
    const fulfilledUnitCostCurrency = productData[0].fulfilledUnitCostCurrency;
    res.render('products/getProfitForProduct', {
        profitper: profitper,
        selling_price: selling_price,
        profitability: profitability,
        profit: profit,
        fulfilledUnitCost: fulfilledUnitCost,
        fulfilledUnitCostCurrency: fulfilledUnitCostCurrency,
        request_url: 'product_search',
        user: req.session.name,
        email: req.session.email,
        role: req.session.role
    });
}

// Controller for getting list of lowest prices that are being offered for a selected product in that marketplace.
module.exports.getLowestPricesOffersForProducts = async (req, res, next) => {
    const accessKey = req.session.AccessKey;
    const accessSecret = req.session.AccessSecret;
    var amazonMws = require('amazon-mws')(accessKey, accessSecret);
   //console.log("RESSUULLTT>>",req.body)
    var ASIN = '';
   // console.log("ASINN>>>>>",req.params.asin)
    var ProductsData = [];
    await amazonMws.products.searchFor({
        'Version': '2011-10-01',
        'Action': 'GetLowestPricedOffersForASIN',
        'SellerId': req.session.SellerID,
        'MWSAuthToken': req.session.MwsToken,
        'MarketplaceId': req.session.Marketplace,
        'ASIN':'B07G8Y3N45',
        'ItemCondition': 'New'
    }, function (error, response) {
        if (error) {
            console.log('error products', error);
        }
     
        console.log('Response Test ==> ', response);
        
        
    //    if(response == null && response !== undefined){
    //    console.log('no data available--');
            
        if ("Offers" in response &&
            "Offer" in response.Offers
        ) {
            if (response.Offers.Offer === Array) {

                response.Offers.Offer.map((data, item) => {

                    ProductsData.push({
                        'itemCondition': data.SubCondition,
                        'sellerRating': data.SellerFeedbackRating.SellerPositiveFeedbackRating,
                        'feedbackCount': data.SellerFeedbackRating.FeedbackCount,
                        'minHoursTaken': data.ShippingTime.minimumHours,
                        'maxHoursTaken': data.ShippingTime.maximumHours,
                        'availability': data.ShippingTime.availabilityType,
                        'listPrice': data.ListingPrice.Amount,
                        'listPriceCurrency': data.ListingPrice.CurrencyCode,
                        'shippingCharges': data.Shipping.Amount,
                        'ShippingChargesCurrency': data.Shipping.CurrencyCode,
                        'isProductFBA': data.IsFulfilledByAmazon
                    });

                });

            } else {
                ProductsData.push({
                    'itemCondition': response.Offers.Offer.SubCondition,
                    'sellerRating': response.Offers.Offer.SellerFeedbackRating.SellerPositiveFeedbackRating,
                    'feedbackCount': response.Offers.Offer.SellerFeedbackRating.FeedbackCount,
                    'minHoursTaken': response.Offers.Offer.ShippingTime.minimumHours,
                    'maxHoursTaken': response.Offers.Offer.ShippingTime.maximumHours,
                    'availability': response.Offers.Offer.ShippingTime.availabilityType,
                    'listPrice': response.Offers.Offer.ListingPrice.Amount,
                    'listPriceCurrency': response.Offers.Offer.ListingPrice.CurrencyCode,
                    'shippingCharges': response.Offers.Offer.Shipping.Amount,
                    'ShippingChargesCurrency': response.Offers.Offer.Shipping.CurrencyCode,
                    'isProductFBA': response.Offers.Offer.IsFulfilledByAmazon
                });
            }
        } else {
            console.log('Key doesnt exist!');
        }

        res.render('products/getLowestPricesOffersForProducts', {
            request_url: 'product_search',
            user: req.session.name,
            email: req.session.email,
            role: req.session.role,
            lowPriceData: ProductsData
        });
    // };
    });
    
}

// Controller for searching products by relevancy in a selected marketplace.
module.exports.searchProducts = (req, res, next) => {
    res.render('products/search-products', {
        request_url: 'product_search',
        user: req.session.name,
        email: req.session.email,
        role: req.session.role
    });
}

// Controller for showing results for search products by relevancy API.
module.exports.showResults = (req, res, next) => {
    const accessKey = req.session.AccessKey;
    const accessSecret = req.session.AccessSecret;
    var amazonMws = require('amazon-mws')(accessKey, accessSecret);
    var QUERY = '';
    QUERY = req.body.userQuery;
    var arrayOne = [];

    amazonMws.products.search({
        'Version': '2011-10-01',
        'Action': 'ListMatchingProducts',
        'SellerId': req.session.SellerID,
        'MWSAuthToken': req.session.MwsToken,
        'MarketplaceId': req.session.Marketplace,
        'Query': QUERY
    }, function (error, response) {
        if (error) {
            console.log('error products', error);
            return;
        }

        response.Products.Product.map((prod, indx) => {

            if ("AttributeSets" in prod &&
                "ItemAttributes" in prod.AttributeSets &&
                "ListPrice" in prod.AttributeSets.ItemAttributes
            ) {

                var arrayCheck = Array.isArray(prod.SalesRankings.SalesRank);

                if (arrayCheck === true) {

                    prod.SalesRankings.SalesRank.map((sale, index) => {

                        arrayOne.push({
                            'id': uuid(),
                            'description': prod.AttributeSets.ItemAttributes.Title,
                            'brand': prod.AttributeSets.ItemAttributes.Brand,
                            'color': prod.AttributeSets.ItemAttributes.Color,
                            'label': prod.AttributeSets.ItemAttributes.Label,
                            'price': prod.AttributeSets.ItemAttributes.ListPrice.Amount,
                            'currency': prod.AttributeSets.ItemAttributes.ListPrice.CurrencyCode,
                            'model': prod.AttributeSets.ItemAttributes.Model,
                            'size': prod.AttributeSets.ItemAttributes.Size,
                            'quantity': prod.AttributeSets.ItemAttributes.NumberOfItems,
                            'image': prod.AttributeSets.ItemAttributes.SmallImage.URL,
                            'asin': prod.Identifiers.MarketplaceASIN.ASIN,
                            'rank': sale.Rank
                        });
                    })

                } else {

                    if (Object.entries(prod.SalesRankings).length === 0 && prod.SalesRankings.constructor === Object) {

                        arrayOne.push({
                            'id': uuid(),
                            'description': prod.AttributeSets.ItemAttributes.Title,
                            'brand': prod.AttributeSets.ItemAttributes.Brand,
                            'color': prod.AttributeSets.ItemAttributes.Color,
                            'label': prod.AttributeSets.ItemAttributes.Label,
                            'price': prod.AttributeSets.ItemAttributes.ListPrice.Amount,
                            'currency': prod.AttributeSets.ItemAttributes.ListPrice.CurrencyCode,
                            'model': prod.AttributeSets.ItemAttributes.Model,
                            'size': prod.AttributeSets.ItemAttributes.Size,
                            'quantity': prod.AttributeSets.ItemAttributes.NumberOfItems,
                            'image': prod.AttributeSets.ItemAttributes.SmallImage.URL,
                            'asin': prod.Identifiers.MarketplaceASIN.ASIN,
                            'rank': null
                        });

                    } else {
                        arrayOne.push({
                            'id': uuid(),
                            'description': prod.AttributeSets.ItemAttributes.Title,
                            'brand': prod.AttributeSets.ItemAttributes.Brand,
                            'color': prod.AttributeSets.ItemAttributes.Color,
                            'label': prod.AttributeSets.ItemAttributes.Label,
                            'price': prod.AttributeSets.ItemAttributes.ListPrice.Amount,
                            'currency': prod.AttributeSets.ItemAttributes.ListPrice.CurrencyCode,
                            'model': prod.AttributeSets.ItemAttributes.Model,
                            'size': prod.AttributeSets.ItemAttributes.Size,
                            'quantity': prod.AttributeSets.ItemAttributes.NumberOfItems,
                            'image': prod.AttributeSets.ItemAttributes.SmallImage.URL,
                            'asin': prod.Identifiers.MarketplaceASIN.ASIN,
                            'rank': prod.SalesRankings.SalesRank.Rank
                        });
                    }
                }
            }
        });

        res.render('products/show-results', {
            request_url: 'product_search',
            user: req.session.name,
            email: req.session.email,
            role: req.session.role,
            searchdata: arrayOne,
            query: QUERY
        });

    });
}

// Controller for getting list of lowest prices being offered for a particular product.
module.exports.getLowestPricesOffers = async (req, res, next) => {
    const accessKey = req.session.AccessKey;
    const accessSecret = req.session.AccessSecret;
    var amazonMws = require('amazon-mws')(accessKey, accessSecret);
    var ASIN = req.params.asin;
    var ProductsData = [];

    await amazonMws.products.searchFor({
        'Version': '2011-10-01',
        'Action': 'GetLowestPricedOffersForASIN',
        'SellerId': req.session.SellerID,
        'MWSAuthToken': req.session.MwsToken,
        'MarketplaceId': req.session.Marketplace,
        'ASIN': ASIN,
        'ItemCondition': 'New'
    }, function (error, response) {
        if (error) {
            console.log('error products', error);
        }

        var arrayTest = Array.isArray(response.Offers.Offer);

        if (arrayTest === true) {

            response.Offers.Offer.map((data, item) => {

                ProductsData.push({
                    'totalOffers': response.Summary.TotalOfferCount,
                    'itemCondition': data.SubCondition,
                    'sellerRating': data.SellerFeedbackRating.SellerPositiveFeedbackRating,
                    'feedbackCount': data.SellerFeedbackRating.FeedbackCount,
                    'minHoursTaken': data.ShippingTime.minimumHours,
                    'maxHoursTaken': data.ShippingTime.maximumHours,
                    'availability': data.ShippingTime.availabilityType,
                    'listPrice': data.ListingPrice.Amount,
                    'listPriceCurrency': data.ListingPrice.CurrencyCode,
                    'shippingCharges': data.Shipping.Amount,
                    'ShippingChargesCurrency': data.Shipping.CurrencyCode,
                    'isProductFBA': data.IsFulfilledByAmazon
                });

            });

        } else {

            ProductsData.push({
                'totalOffers': response.Summary.TotalOfferCount,
                'itemCondition': response.Offers.Offer.SubCondition,
                'sellerRating': response.Offers.Offer.SellerFeedbackRating.SellerPositiveFeedbackRating,
                'feedbackCount': response.Offers.Offer.SellerFeedbackRating.FeedbackCount,
                'minHoursTaken': response.Offers.Offer.ShippingTime.minimumHours,
                'maxHoursTaken': response.Offers.Offer.ShippingTime.maximumHours,
                'availability': response.Offers.Offer.ShippingTime.availabilityType,
                'listPrice': response.Offers.Offer.ListingPrice.Amount,
                'listPriceCurrency': response.Offers.Offer.ListingPrice.CurrencyCode,
                'shippingCharges': response.Offers.Offer.Shipping.Amount,
                'ShippingChargesCurrency': response.Offers.Offer.Shipping.CurrencyCode,
                'isProductFBA': response.Offers.Offer.IsFulfilledByAmazon
            });
        }

        res.render('products/showLowPriceOffers', {
            request_url: 'product_search',
            user: req.session.name,
            email: req.session.email,
            role: req.session.role,
            lowPriceData: ProductsData
        });

    });
}

module.exports.getReimbursements = async(req, res, next) => {
   const reimbursements = await ReimbursementsSchema.find({'userid' : req.session.userid});
   res.render('products/reimbursements', {
                            moment: moment,
                            reimbursements: reimbursements,
                            request_url: 'reimbursements',
                            user: req.session.name,
                            email: req.session.email,
                            role: req.session.role
                        }); 
};

//Controller for buycost
module.exports.addbuycost = (req, res) => {
    var ID = req.param('id');
    var val = req.param('val');

    AmazonProductsSchema.update({ '_id': ID},{
        $set: {'buycost': val }
    }, (err) => {
        if (err) {console.log(err);}
        Order.find({'idmatch': ID}, function(err, data) {
            for(var i=0; i<data.length; i++){
                Order.update({'AmazonOrderID': data[i].AmazonOrderID},
                { $set: {'buycost': val}}, (err) => {
                    if (err) {console.log(err);}
                    console.log('updated...');  
                });
            }
        });
        req.flash('success_msg', 'buycost added successfully !');
        res.redirect('/products/list-products');
    });
}

//sku Profitability
module.exports.skuprofitability = async(req, res, next) => {
    const data = await User.find({ 'email': req.session.email });
    const reg_date = data[0].created;
    var date = format('dd-MM-yyyy', new Date(reg_date));

    Order.aggregate([
       { $match: { "PurchaseDate": { "$gte": date} } },         
        {
           $group: {
               _id: '$idmatch',
               totalPrice: { $sum: { $multiply: ["$OrderTotal"] } },
                fees: {
                    $sum: {
                       $add: ["$FBAPerOrderFulfillmentFee", "$FBAPerUnitFulfillmentFee", "$FBAWeightBasedFee", "$Commission","$FixedClosingFee","$GiftwrapChargeback","$SalesTaxCollectionFee","$ShippingChargeback"
                           
                       ]
                    }
               },
               count: { $sum: 1 }
           }
        } 
   ])
   .exec(function(err, transactions) {
    console.log('transactions',transactions)
        if (transactions.length > 0) {
            AmazonProductsSchema.populate(transactions, { path: '_id' }, function(err, populatedTransactions) {
                res.render('products/skuprofitability', {
                   products : populatedTransactions,
                   request_url: 'skuprofitability',
                   user: req.session.name,
                   Decimal,
                   email: req.session.email,
                   role: req.session.role,
                });
            });
        } 
    });

    
}