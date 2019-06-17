const mongoose = require('mongoose');
const User = mongoose.model('User');
const bcrypt = require('bcryptjs');

module.exports.editProfile = (req, res) => {

    const { username, email, businessName, productNiche, address, tagline, sellerID, mwsAuthToken, accessKey, accessSecret, marketplaceId } = req.body;

    if (!username || !email || !businessName || !productNiche || !address || !tagline || !sellerID || !mwsAuthToken || !accessKey || !accessSecret || !marketplaceId) {

        res.status(400).json({ message: 'All fields are mandatory!', isUpdated: false })

    } else {

        const amazonMws = require('./../../../lib/amazon-mws')(accessKey, accessSecret);

        amazonMws.feeds.search({
            'Version': '2009-01-01',
            'Action': 'GetFeedSubmissionList',
            'SellerId': sellerID,
            'MWSAuthToken': mwsAuthToken,
        }, function (error, response) {
            if (error) {
                res.status(401).json({ message: 'Invalid Amazon MWS credentials.', isUpdated: false });
            } else {

                var promise1 = new Promise((resolve, reject) => {

                    User.update({ 'email': email }, {
                        $set: {
                            'username': username,
                            'email': email,
                            'SellerID': sellerID,
                            'MwsToken': mwsAuthToken,
                            'accessKeyId': accessKey,
                            'accessSecret': accessSecret,
                            'Marketplace': marketplaceId,
                            businessInfo: {
                                'businessName': businessName,
                                'productCategory': productNiche,
                                'address': address,
                                'businessTagline': tagline
                            }
                        }
                    }, (err) => {
                        if (err) {
                            reject();
                        } else {
                            resolve();
                        }
                    });
                });

                promise1.then(() => {
                    res.json({ message: 'Profile updated!', isUpdated: true });
                }).catch(() => {
                    res.status(401).json({ message: 'Error while updating profile!', isUpdated: false });
                })
            }
        });
    }
}


module.exports.changePassword = (req, res) => {

    const { currentPassword, newPassword, confirmPassword, email } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
        res.status(400).json({ message: 'All fields are mandatory', isUpdated: false })
    } else {
        User.findOne({ email })
            .then((user) => {
                if (!user) {
                    res.status(401).json({ message: "There's no user associated with this account.", isUpdated: false })
                } else {
                    bcrypt.compare(currentPassword, user.password)
                        .then(isMatch => {
                            if (!isMatch) {
                                res.status(400).json({ message: 'Invalid current password!', isUpdated: false })
                            } else {
                                if (newPassword !== confirmPassword) {
                                    res.status(400).json({ message: 'Password & Confirm password do not match.', isUpdated: false })
                                } else if (newPassword.length < 6) {
                                    res.status(400).json({ message: 'Password should be at least 6 characters long.', isUpdated: false });
                                } else {
                                    // Resetting new password provided by the front end user.
                                    user.password = newPassword;
                                    user.save(((err) => {
                                        if (err) {
                                            res.status(401).json({ message: 'Error while updating password.', isUpdated: false })
                                        } else {
                                            res.json({ message: 'Password has been changed!', isUpdated: true })
                                        }
                                    }))
                                }
                            }
                        })
                }
            })
    }

}

module.exports.getUser = (req, res) => {
    res.send('All set!');
}