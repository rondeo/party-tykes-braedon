const uuid = require('uuid/v4');
const mongoose = require('mongoose');
const User = mongoose.model('User');
var fse = require('fs');
var AmazonProductsSchema = require('./../../../models/amazonProducts');

module.exports.addNewProduct = (req, res, next) => {

    console.log('Add product Route Hit');

    const { sku, asin, productTitle, productBrand, productDescription, productPrice, productManufacturer } = req.body;

    const { sellerId, mwsToken, accessKey, accessSecret } = req.user;

    const amazonMws = require('./../../../lib/amazon-mws')(accessKey, accessSecret);

    var counter = 0;

    var content = '<AmazonEnvelope xmlns:xsi="http:www.w3.org/2001/XMLSchema-instance">'
        + '<Header>'
        + '<DocumentVersion>1.01</DocumentVersion>'
        + '<MerchantIdentifier>MY_IDENTIFIER_8262</MerchantIdentifier>'
        + '</Header>'
        + '<MessageType>Product</MessageType>'
        + '<PurgeAndReplace>false</PurgeAndReplace>'
        + '<Message>'
        + '<MessageID>1</MessageID>'
        + '<OperationType>Update</OperationType>'
        + '<Product>'
        + '<SKU>' + sku + '</SKU>'
        + '<StandardProductID>'
        + '<Type>ASIN</Type>'
        + '<Value>' + asin + '</Value>'
        + '</StandardProductID>'
        + '<ProductTaxCode>A_GEN_NOTAX</ProductTaxCode>'
        + '<DescriptionData>'
        + '<Title>' + productTitle + '</Title>'
        + '<Brand>' + productBrand + '</Brand>'
        + '<Description>' + productDescription + '</Description>'
        + '<BulletPoint>Test Bullet Point 1</BulletPoint>'
        + '<BulletPoint>Test Bullet Point 2</BulletPoint>'
        + '<MSRP currency="USD">' + productPrice + '</MSRP>'
        + '<Manufacturer>' + productManufacturer + '</Manufacturer>'
        + '</DescriptionData>'
        + '<ProductData>'
        + '<Health>'
        + '<ProductType>'
        + '<HealthMisc>'
        + '<Ingredients>Test Ingredients</Ingredients>'
        + '<Directions>Test Directions</Directions>'
        + '</HealthMisc>'
        + '</ProductType>'
        + '</Health>'
        + '</ProductData>'
        + '</Product>'
        + '</Message>'
        + '</AmazonEnvelope>';

    if (!sku || !asin || !productTitle || !productBrand || !productDescription || !productPrice || !productManufacturer) {
        res.status(401).json({ message: 'All fields are mandatory!' })
    } else {

        let filename = uuid();

        fse.writeFile(`mwsFiles/${filename}.txt`, content, (err) => {

            if (err) throw err;

            var FeedContent = fse.readFileSync(`mwsFiles/${filename}.txt`, 'UTF-8');

            if (counter == 29) {
                res.status(403).json({ message: 'Maximum request limit reached. Please wait for sometime before sending request again!' });
            } else {
                amazonMws.feeds.submit({
                    'Version': '2009-01-01',
                    'Action': 'SubmitFeed',
                    'FeedType': '_POST_PRODUCT_DATA_',
                    'FeedContent': FeedContent,
                    'SellerId': sellerId,
                    'MWSAuthToken': mwsToken
                }, function (error, response) {
                    if (error) {
                        res.status(500).json({ productAdded: false, message: 'Error connecting to Amazon API.' })
                    } else {
                        res.json({
                            productAdded: true,
                            message: 'Your request for adding a new product has been received. It might take some time for amazon to confirm it & reflect in your inventory shortly.'
                        })
                    }
                    counter++;
                });
            }
        });
    }
}

module.exports.fetchAllProducts = (req, res) => {

    const { id } = req.user;

    var promise1 = new Promise((resolve, reject) => {

        AmazonProductsSchema.find({ 'userid': id }, (err, data) => {
            if (err) { reject(err) }
            else {
                resolve(data);
            }
        });

    });

    promise1.then((products) => {
        res.json({ data: products, success: true })
    }).catch((error) => {
        res.status(500).json({ success: false, message: 'Error while fetching products data.' });
    })

}

module.exports.productFinder = (req, res) => {

    const { searchQuery, email } = req.body;

    var arrayOne = [];

    if (!searchQuery) {
        res.status(400).json({ message: 'Search Query can not be empty', success: false })
    } else {
        var promise = new Promise((resolve, reject) => {

            User.findOne({ email })

                .then((user) => {

                    const amazonMws = require('./../../../lib/amazon-mws')(user.accessKeyId, user.accessSecret);

                    amazonMws.products.search({
                        'Version': '2011-10-01',
                        'Action': 'ListMatchingProducts',
                        'SellerId': user.SellerID,
                        'MWSAuthToken': user.MwsToken,
                        'MarketplaceId': user.Marketplace,
                        'Query': searchQuery
                    }, function (error, response) {
                        if (error) {
                            reject(error)
                        }

                        if ("Products" in response && "Product" in response.Products) {

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
                                                'description': prod.AttributeSets.ItemAttributes.Title ? prod.AttributeSets.ItemAttributes.Title : 'N/A',
                                                'brand': prod.AttributeSets.ItemAttributes.Brand ? prod.AttributeSets.ItemAttributes.Brand : 'N/A',
                                                'color': prod.AttributeSets.ItemAttributes.Color ? prod.AttributeSets.ItemAttributes.Color : 'N/A',
                                                'label': prod.AttributeSets.ItemAttributes.Label ? prod.AttributeSets.ItemAttributes.Label : 'N/A',
                                                'price': prod.AttributeSets.ItemAttributes.ListPrice.Amount ? prod.AttributeSets.ItemAttributes.ListPrice.Amount : 'N/A',
                                                'currency': prod.AttributeSets.ItemAttributes.ListPrice.CurrencyCode ? prod.AttributeSets.ItemAttributes.ListPrice.CurrencyCode : 'N/A',
                                                'model': prod.AttributeSets.ItemAttributes.Model ? prod.AttributeSets.ItemAttributes.Model : 'N/A',
                                                'size': prod.AttributeSets.ItemAttributes.Size ? prod.AttributeSets.ItemAttributes.Size : 'N/A',
                                                'quantity': prod.AttributeSets.ItemAttributes.NumberOfItems ? prod.AttributeSets.ItemAttributes.NumberOfItems : 'N/A',
                                                'image': prod.AttributeSets.ItemAttributes.SmallImage.URL ? prod.AttributeSets.ItemAttributes.SmallImage.URL : 'N/A',
                                                'asin': prod.Identifiers.MarketplaceASIN.ASIN ? prod.Identifiers.MarketplaceASIN.ASIN : 'N/A',
                                                'rank': sale.Rank ? sale.Rank : 'N/A'
                                            });
                                        })

                                    } else {

                                        if (Object.entries(prod.SalesRankings).length === 0 && prod.SalesRankings.constructor === Object) {

                                            arrayOne.push({
                                                'id': uuid(),
                                                'description': prod.AttributeSets.ItemAttributes.Title ? prod.AttributeSets.ItemAttributes.Title : 'N/A',
                                                'brand': prod.AttributeSets.ItemAttributes.Brand ? prod.AttributeSets.ItemAttributes.Brand : 'N/A',
                                                'color': prod.AttributeSets.ItemAttributes.Color ? prod.AttributeSets.ItemAttributes.Color : 'N/A',
                                                'label': prod.AttributeSets.ItemAttributes.Label ? prod.AttributeSets.ItemAttributes.Label : 'N/A',
                                                'price': prod.AttributeSets.ItemAttributes.ListPrice.Amount ? prod.AttributeSets.ItemAttributes.ListPrice.Amount : 'N/A',
                                                'currency': prod.AttributeSets.ItemAttributes.ListPrice.CurrencyCode ? prod.AttributeSets.ItemAttributes.ListPrice.CurrencyCode : 'N/A',
                                                'model': prod.AttributeSets.ItemAttributes.Model ? prod.AttributeSets.ItemAttributes.Model : 'N/A',
                                                'size': prod.AttributeSets.ItemAttributes.Size ? prod.AttributeSets.ItemAttributes.Size : 'N/A',
                                                'quantity': prod.AttributeSets.ItemAttributes.NumberOfItems ? prod.AttributeSets.ItemAttributes.NumberOfItems : 'N/A',
                                                'image': prod.AttributeSets.ItemAttributes.SmallImage.URL ? prod.AttributeSets.ItemAttributes.SmallImage.URL : 'N/A',
                                                'asin': prod.Identifiers.MarketplaceASIN.ASIN ? prod.Identifiers.MarketplaceASIN.ASIN : 'N/A',
                                                'rank': 'N/A'
                                            });

                                        } else {
                                            arrayOne.push({
                                                'id': uuid(),
                                                'description': prod.AttributeSets.ItemAttributes.Title ? prod.AttributeSets.ItemAttributes.Title : 'N/A',
                                                'brand': prod.AttributeSets.ItemAttributes.Brand ? prod.AttributeSets.ItemAttributes.Brand : 'N/A',
                                                'color': prod.AttributeSets.ItemAttributes.Color ? prod.AttributeSets.ItemAttributes.Color : 'N/A',
                                                'label': prod.AttributeSets.ItemAttributes.Label ? prod.AttributeSets.ItemAttributes.Label : 'N/A',
                                                'price': prod.AttributeSets.ItemAttributes.ListPrice.Amount ? prod.AttributeSets.ItemAttributes.ListPrice.Amount : 'N/A',
                                                'currency': prod.AttributeSets.ItemAttributes.ListPrice.CurrencyCode ? prod.AttributeSets.ItemAttributes.ListPrice.CurrencyCode : 'N/A',
                                                'model': prod.AttributeSets.ItemAttributes.Model ? prod.AttributeSets.ItemAttributes.Model : 'N/A',
                                                'size': prod.AttributeSets.ItemAttributes.Size ? prod.AttributeSets.ItemAttributes.Size : 'N/A',
                                                'quantity': prod.AttributeSets.ItemAttributes.NumberOfItems ? prod.AttributeSets.ItemAttributes.NumberOfItems : 'N/A',
                                                'image': prod.AttributeSets.ItemAttributes.SmallImage.URL ? prod.AttributeSets.ItemAttributes.SmallImage.URL : 'N/A',
                                                'asin': prod.Identifiers.MarketplaceASIN.ASIN ? prod.Identifiers.MarketplaceASIN.ASIN : 'N/A',
                                                'rank': prod.SalesRankings.SalesRank.Rank ? prod.SalesRankings.SalesRank.Rank : 'N/A'
                                            });
                                        }
                                    }
                                }
                            });
                        } else {
                            res.status(401).json({ message: 'No data found!', success: false })
                        }
                        resolve(arrayOne);
                    });
                });
        });
    }

    promise.then((data) => {
        res.json({ data: data, success: true })
    }).catch((err) => {
        res.status(500).json({ message: err, success: false })
    })

}

module.exports.checkLowestPrices = (req, res) => {

    const { asin } = req.body;
    const { sellerId, mwsToken, marketplaceId, accessKey, accessSecret } = req.user;

    const amazonMws = require('./../../../lib/amazon-mws')(accessKey, accessSecret);

    var ProductsData = [];

    if (asin) {

        var promise = new Promise((resolve, reject) => {

            async function getRecords() {

                await amazonMws.products.searchFor({
                    'Version': '2011-10-01',
                    'Action': 'GetLowestPricedOffersForASIN',
                    'SellerId': sellerId,
                    'MWSAuthToken': mwsToken,
                    'MarketplaceId': marketplaceId,
                    'ASIN': asin,
                    'ItemCondition': 'New'
                }, function (error, response) {

                    if (error) {
                        reject(error);
                    }

                    if (response !== null && response !== undefined) {

                        if ("Offers" in response && "Offer" in response.Offers) {

                            var arrayTest = Array.isArray(response.Offers.Offer);

                            if (arrayTest === true) {

                                response.Offers.Offer.map((data, item) => {
                                    ProductsData.push({
                                        'listPrice': data.ListingPrice.Amount ? data.ListingPrice.Amount : 'N/A',
                                        'shippingCharges': data.Shipping.Amount ? data.Shipping.Amount : 'N/A',
                                        'isProductFBA': data.IsFulfilledByAmazon ? data.IsFulfilledByAmazon : 'N/A',
                                        'itemCondition': data.SubCondition ? data.SubCondition : 'N/A',
                                        'availability': data.ShippingTime.availabilityType ? data.ShippingTime.availabilityType : 'N/A',
                                        'minHoursTaken': data.ShippingTime.minimumHours ? data.ShippingTime.minimumHours : 'N/A',
                                        'maxHoursTaken': data.ShippingTime.maximumHours ? data.ShippingTime.maximumHours : 'N/A',
                                        'sellerRating': data.SellerFeedbackRating.SellerPositiveFeedbackRating ? data.SellerFeedbackRating.SellerPositiveFeedbackRating : 'N/A',
                                        'feedbackCount': data.SellerFeedbackRating.FeedbackCount ? data.SellerFeedbackRating.FeedbackCount : 'N/A',
                                        // 'listPriceCurrency': data.ListingPrice.CurrencyCode,                
                                        // 'ShippingChargesCurrency': data.Shipping.CurrencyCode,
                                        // 'totalOffers': response.Summary.TotalOfferCount,
                                    });
                                });

                            } else {

                                ProductsData.push({
                                    'listPrice': response.Offers.Offer.ListingPrice.Amount ? response.Offers.Offer.ListingPrice.Amount : 'N/A',
                                    'shippingCharges': response.Offers.Offer.Shipping.Amount ? response.Offers.Offer.Shipping.Amount : 'N/A',
                                    'isProductFBA': response.Offers.Offer.IsFulfilledByAmazon ? response.Offers.Offer.IsFulfilledByAmazon : 'N/A',
                                    'itemCondition': response.Offers.Offer.SubCondition ? response.Offers.Offer.SubCondition : 'N/A',
                                    'availability': response.Offers.Offer.ShippingTime.availabilityType ? response.Offers.Offer.ShippingTime.availabilityType : 'N/A',
                                    'minHoursTaken': response.Offers.Offer.ShippingTime.minimumHours ? response.Offers.Offer.ShippingTime.minimumHours : 'N/A',
                                    'maxHoursTaken': response.Offers.Offer.ShippingTime.maximumHours ? response.Offers.Offer.ShippingTime.maximumHours : 'N/A',
                                    'sellerRating': response.Offers.Offer.SellerFeedbackRating.SellerPositiveFeedbackRating ? response.Offers.Offer.SellerFeedbackRating.SellerPositiveFeedbackRating : 'N/A',
                                    'feedbackCount': response.Offers.Offer.SellerFeedbackRating.FeedbackCount ? response.Offers.Offer.SellerFeedbackRating.FeedbackCount : 'N/A',
                                    // 'totalOffers': response.Summary.TotalOfferCount,
                                    // 'listPriceCurrency': response.Offers.Offer.ListingPrice.CurrencyCode,                                   
                                    // 'ShippingChargesCurrency': response.Offers.Offer.Shipping.CurrencyCode,

                                });
                            }

                        } else {
                            res.status(401).json({ message: 'No record found!', done: false })
                        }

                    } else {
                        res.status(400).json({ message: 'Not responding.', done: false })
                    }
                    resolve(ProductsData);
                });
            }
            getRecords();
        });

        promise.then((data) => {
            res.json({ data: data, done: true })
        }).catch((err) => {
            res.status(500).json({ message: err, done: false })
        })

    } else {
        res.status(400).json({ message: 'Unable to fetch product ASIN.', done: false })
    }

}