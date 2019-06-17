const mongoose = require('mongoose');
const async = require('async');
const User = mongoose.model('User');
const querystring = require('querystring');
const Request = require('request');
const config = require('config');
const accessKey = config.get('MWS_ACCESS_KEY');
const accessSecret = config.get('MWS_ACCESS_SECRET');
const clientID = config.get('MWS_CLIENT_ID');
const clientSecret = config.get('MWS_CLIENT_SECRET');
var amazonMws = require('amazon-mws')(accessKey, accessSecret);

module.exports.loginwithamazon = (req, res, next) => {
    let accessToken = '';
    let refreshToken = '';
    let latestAccessToken = '';
    let latestRefreshToken = '';
    let userID = '';
    let userName = '';
    let userEmail = '';
    let userPostalCode = '';
    let userRole = '';
    let userType = '';

    function getResponseCodes(getResponseCodesCallback) {
        console.log('AUTH CODE RECEIVED : ', req.query.code);
        const { code } = req.query;
        Request.post({
            url: 'https://api.amazon.com/auth/o2/token',
            form: {
                grant_type: 'authorization_code',
                code,
                client_id: clientID,
                client_secret: clientSecret,
            },
        }, (err, httpResponse, body) => {
            const parsedBody = JSON.parse(body);
            console.log('FIRST ACCESS TOKEN : ', parsedBody.access_token);
            console.log('FIRST REFRESH TOKEN : ', parsedBody.refresh_token);
            accessToken = parsedBody.access_token;
            refreshToken = parsedBody.refresh_token;
            getResponseCodesCallback(null, accessToken, refreshToken);
        });
    }

    function updateAccessToken(userAccessToken, userRefreshToken, updateAccessTokenCallback) {
        Request.post({
            url: 'https://api.amazon.com/auth/o2/token',
            form: {
                grant_type: 'refresh_token',
                refresh_token: userRefreshToken,
                client_id: clientID,
                client_secret: clientSecret,
            },
        }, (err, httpResponse, body) => {
            const parsedBody = JSON.parse(body);

            latestAccessToken = parsedBody.access_token;
            latestRefreshToken = parsedBody.refresh_token;

            console.log('LATEST ACCESS TOKEN : ', latestAccessToken);
            console.log('LATEST REFRESH TOKEN : ', latestRefreshToken);

            updateAccessTokenCallback(null, latestAccessToken, latestRefreshToken);
        });
    }

    function retrieveUserProfile(accesstoken, refreshtoken, retrieveUserProfileCallback) {
        Request({
            url: 'https://api.amazon.com/user/profile',
            headers: {
                Authorization: `Bearer ${accesstoken}`,
            },
            rejectUnauthorized: false,
        }, (err, resp) => {
            if (err) {
                console.error(err);
            } else {
                const parsedBody = JSON.parse(resp.body);
                console.log(resp.body)
                userID = parsedBody.user_id;
                userName = parsedBody.name;
                userEmail = parsedBody.email;
                userRole = parsedBody.role;
                userType = 'viaAmazon';
                userPostalCode = parsedBody.postal_code;


                if (userName !== null) {
                    req.session.name = userName;
                    req.session.email = userEmail;
                    console.log('Mera response', req.session.email)
                    req.session.userid = userID;
                    req.session.role = userRole;
                    req.session.userType = userType;
                    console.log("RES",req.session.userType);
                }

                console.log('PROFILE UID : ', userID);
                console.log('PROFILE NAME : ', userName);
                console.log('PROFILE EMAIL : ', userEmail);
                console.log('PROFILE POSTAL : ', userPostalCode);
                console.log('REFRESH TOKEN REQUIRED : ', refreshtoken);
                console.log('UserType', userType);

                User.findOne({ 'email': userEmail }, function (err, resp) {
                    if (err) {
                        console.log('ERR : ', err);
                    }
                    if (resp == null) {
                        var user = new User();

                        user.AmazonUID = userID;
                        user.username = userName;
                        user.email = userEmail;
                        user.Amazon_RefreshToken = refreshtoken
                        user.userType = userType;
                        user.save(((err) => {
                            if (err) {
                                throw err
                            }
                            console.log('AMAZON USERDATA SAVED!!');
                        }));

                        const params = {
                            userid: userID
                        };

                        const stringified = querystring.stringify(params);

                        res.redirect('/amazon/get-credentials-forAmazon' + '?' + stringified);

                    }
                    else {
                        if (resp.SellerID !== null || resp.SellerID !== undefined) {
                            req.session.SellerID = resp.SellerID;
                            req.session.MwsToken = resp.MwsToken;
                            req.session.Marketplace = resp.Marketplace;
                            req.session.AccessKey = resp.AccessKey;
                            req.session.AccessSecret = resp.AccessSecret;
                            if (resp.status == 'active')
                                res.redirect('/dashboard/show-dashboard');
                            if (resp.status == 'inactive') {
                                req.flash('error_msg', 'Your account is in-active. Please contact the support');
                                res.redirect('/');
                            }
                        }
                        else {
                            const params = {
                                userid: userID
                            };

                            const stringified = querystring.stringify(params);

                            res.redirect('/amazon/get-credentials-forAmazon' + '?' + stringified);
                        }
                    }
                });
            }
        });

        retrieveUserProfileCallback();
    }

    async.waterfall([
        getResponseCodes,
        updateAccessToken,
        retrieveUserProfile,
    ], (error) => {
        if (error) {
            console.log('ERROR : ', error);
        }
    });
}

module.exports.getCredentialsForAmazon = (req, res, next) => {
    console.log("RAWW", req.body)
    res.render('amazon/getCredentialsForAmazon', { layout: 'frontend', uid: req.query.userid });
}

module.exports.skipCredentialsForAmazon = (req, res, next) => {
    req.flash('success_msg', 'User login successfully.');
    res.redirect('/dashboard/show-dashboard');
}

module.exports.submitCredentialsForAmazon = (req, res, next) => {

    const params = {
        userid: req.body.uuid
    };

    const stringified = querystring.stringify(params);

    amazonMws.feeds.search({
        'Version': '2009-01-01',
        'Action': 'GetFeedSubmissionList',
        'SellerId': req.body.SellerID,
        'MWSAuthToken': req.body.Token,
    }, function (error, response) {
        if (error) {
            console.log('error', error);
            req.flash('error_msg', 'sorry! You are entering wrong credentials.');
            res.redirect('/amazon/get-credentials-forAmazon' + '?' + stringified);
            return;
        }
        User.update({ 'AmazonUID': req.body.uuid },
            {
                $set: {
                    'SellerID': req.body.SellerID,
                    'MwsToken': req.body.MwsToken,
                    'Marketplace': req.body.Marketplace,
                    'AccessKey': req.body.AccessKey,
                    'AccessSecret': req.body.AccessSecret
                }
            }, (err) => {
                if (err) {
                    console.log(err);
                }
                console.log('DATA UPDATED!');
            });

        req.flash('success_msg', 'User login successfully.');
        res.redirect('/dashboard/show-dashboard');
    });
}