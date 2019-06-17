const mongoose = require('mongoose');
const User = mongoose.model('User');

module.exports.checkCredentials = (req, res) => {

    const { sellerID, mwsToken, marketplaceID, accessKey, accessSecret, email } = req.body;

    if (!sellerID || !mwsToken || !marketplaceID || !accessKey || !accessSecret) {

        res.status(400).json({ message: 'All fields are mandatory.', mwsVerified: false });

    } else {

        const amazonMws = require('./../../../lib/amazon-mws')(accessKey, accessSecret);

        amazonMws.feeds.search({
            'Version': '2009-01-01',
            'Action': 'GetFeedSubmissionList',
            'SellerId': sellerID,
            'MWSAuthToken': mwsToken,
        }, function (error, response) {
            if (error) {
                res.status(401).json({ message: 'Invalid Amazon MWS credentials!', mwsVerified: false });
            } else {

                var promise = new Promise((resolve, reject) => {
                    const userData = User.find({}, (err, mydata) => {
                        if (err) {
                            reject(err)
                        } else {
                            resolve(userData);
                        }
                    });

                });

                promise.then((user) => {

                    user.forEach((dbData, key) => {

                        if (dbData.SellerID === sellerID) {
                            res.status(403).json({ message: 'This seller ID is already associated with another account.', mwsVerified: false });
                        } else if (dbData.MwsToken === mwsToken) {
                            res.status(403).json({ message: 'This Mws Token is already associated with another account.', mwsVerified: false });
                        } else if (dbData.accessKeyId === accessKey) {
                            res.status(403).json({ message: 'This Access Key ID is already associated with another account.', mwsVerified: false });
                        } else if (dbData.accessSecret === accessSecret) {
                            res.status(403).json({ message: 'This Access Secret is already associated with another account.', mwsVerified: false });
                        } else {

                            var promise1 = new Promise((resolve, reject) => {

                                User.update({ 'email': email }, {
                                    $set: {
                                        'SellerID': sellerID,
                                        'MwsToken': mwsToken,
                                        'accessKeyId': accessKey,
                                        'accessSecret': accessSecret,
                                        'Marketplace': marketplaceID,
                                        'isMwsVerified': true
                                    }
                                }, (err) => {
                                    if (err) {
                                        res.status(501).json({ message: 'Error while updating MWS data.', mwsVerified: false })
                                    } else {
                                        resolve();
                                    }
                                });
                            });

                            var promise2 = new Promise((resolve, reject) => {

                                promise1.then(() => {
                                    User.findOne({
                                        email: email
                                    }).exec((err, user) => {
                                        if (user) {
                                            resolve(user)
                                        } else {
                                            reject('User Not Found');
                                        }
                                    });
                                });
                            });

                            promise2.then((user) => {
                                if (user) {
                                    res.json({ message: 'Amazon MWS credentials verified!', mwsVerified: true, user: user });
                                }
                            }).catch((err) => {
                                if (err) {
                                    res.json({ message: err, mwsVerified: false })
                                }
                            });
                        }
                    });
                });
            }
        });
    }
}   