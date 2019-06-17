module.exports.fetchAllTransactions = (req, res) => {

    const { sellerId, mwsToken, accessKey, accessSecret } = req.user;

    const amazonMws = require('./../../../lib/amazon-mws')(accessKey, accessSecret);

    var promise = new Promise((resolve, reject) => {
        amazonMws.finances.search({
            'Version': '2015-05-01',
            'Action': 'ListFinancialEvents',
            'SellerId': sellerId,
            'MWSAuthToken': mwsToken,
            'PostedAfter': new Date(2019, 6, 1)
        }, function (error, response) {
            if (error) {
                reject(error);
            } else {
                resolve(response);
            }
        });
    });

    promise.then((data) => {
        console.log('Response data ==> ', data.FinancialEvents);
    }).catch((err) => {
        console.log('Error while fetching API ==> ', err);
    })

}