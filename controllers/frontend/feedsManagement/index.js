var fse = require('fs-extra');

module.exports.submitFeed = (req, res) => {

    const { id, sellerId, mwsToken, marketplaceId, accessKey, accessSecret } = req.user;

    const amazonMws = require('./../../../lib/amazon-mws')(accessKey, accessSecret);

    var FeedContent = fse.readFileSync('mwsFiles/file2.txt', 'UTF-8');

    amazonMws.feeds.submit({
        'Version': '2009-01-01',
        'Action': 'SubmitFeed',
        'FeedType': '_POST_PRODUCT_DATA_',
        'FeedContent': FeedContent,
        'SellerId': sellerId,
        'MWSAuthToken': mwsToken
    }, function (error, response) {
        if (error) {
            console.log('error ', error);
        }
        console.log('response', response);
    });

}