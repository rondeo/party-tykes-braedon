var AmazonFulfillmentSchema = require('./../../../models/amazonFulfillmentOrders');

module.exports.getFulfillmentDetails = (req, res) => {

    const { sellerFulfillmentOrderId } = req.body;
    const { sellerId, mwsToken, accessKey, accessSecret } = req.user;

    const amazonMws = require('./../../../lib/amazon-mws')(accessKey, accessSecret);

    var fulfillmentPromise = new Promise((resolve, reject) => {

        amazonMws.fulfillmentOutboundShipment.search({
            'Version': '2010-10-01',
            'Action': 'GetFulfillmentOrder',
            'SellerId': sellerId,
            'MWSAuthToken': mwsToken,
            'AWSAccessKeyId': accessKey,
            'Secret Key': accessSecret,
            'SellerFulfillmentOrderId': sellerFulfillmentOrderId
        }, function (error, response) {
            if (error) {
                console.log('error ', error);
                reject(error);
                return;
            }
            resolve(response.FulfillmentShipment.member);
        });
    });

    fulfillmentPromise.then((details) => {
        res.json({ data: details, success: true })
    }).catch((err) => {
        console.log(err);
        res.status(500).json({ message: 'Error while fetching fulfillment details!', success: false });
    })

}

module.exports.getFulfillmentOrders = (req, res) => {

    AmazonFulfillmentSchema.find({}, (err, fulfillments) => {
        if (err) {
            res.status(500).json({ message: 'Error while fetching fulfillment details!', success: false });
        } else {
            res.json({ data: fulfillments, success: true })
        }
    });

}