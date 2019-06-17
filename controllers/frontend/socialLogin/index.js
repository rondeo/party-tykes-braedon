const mongoose = require('mongoose');
const User = mongoose.model('User');
const jwt = require('jsonwebtoken');
const config = require('config');
var Request = require("request");
const { OAuth2Client } = require('google-auth-library');
const googleClientID = config.get('GOOGLE_CLIENT_ID');
const client = new OAuth2Client(googleClientID);

// Function for Google Authentication
module.exports.googleLogin = (req, res, next) => {

    // Fetching token from req.body
    const { googleToken, plan } = req.body;

    async function verify() {

        // Validating User token from google's server
        const ticket = await client.verifyIdToken({
            idToken: googleToken,
            audience: googleClientID,
        });

        // Payload shows userdata returned by google's server after auth
        const payload = ticket.getPayload();

        var emailPromise = new Promise((resolve, reject) => {
            User.find({ 'email': payload.email }, (err, user) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(user)
                }
            })
        });

        emailPromise.then((data) => {

            if (data[0].isBusinessAdded === false || data[0].isPlanSelected === false || data[0].isMwsVerified === false || data[0].isPaymentReceived === false) {

                // If email is verified, we store the user in DB.
                if (payload.email_verified === true) {

                    var user = new User();

                    // IF plan details exist in request body.
                    if (plan !== null && plan !== undefined) {

                        user.username = payload.name;
                        user.email = payload.email;
                        user.status = 'active';
                        user.role = 'seller';
                        user.userType = 'viaGoogle'
                        user.profilePicture = payload.picture;
                        user.isEmailVerified = true;
                        user.planDetails.planSelected = plan.name;
                        user.planDetails.planDescription = plan.description;
                        user.planDetails.servicesIncluded = plan.service;
                        user.planDetails.planDuration = plan.time;
                        user.planDetails.planPrice = plan.price;
                        user.planDetails.planCurrency = plan.currency;
                        user.isPlanSelected = true;

                        // Creating JWT token
                        jwt.sign(
                            // Encrypting user ID.
                            { id: user.id },
                            config.get('JWT_SECRET'),
                            { expiresIn: 3600 }, // 1 Hour
                            (err, token) => {
                                if (err) throw err;

                                // If there ain't any issue, returning token & user data.
                                res.json({
                                    token,
                                    user: {
                                        id: user.id,
                                        name: user.username,
                                        email: user.email,
                                        isEmailVerified: user.isEmailVerified,
                                        userType: user.userType,
                                        plan: user.planDetails,
                                        isPlanChosen: true,
                                        isPaymentVerified: false
                                    }
                                });
                            }
                        )

                        // If plan details doesn't exist in request body.
                    } else {

                        user.username = payload.name;
                        user.email = payload.email;
                        user.status = 'active';
                        user.role = 'seller';
                        user.userType = 'viaGoogle'
                        user.profilePicture = payload.picture;
                        user.isEmailVerified = true;

                        // Creating JWT token
                        jwt.sign(
                            // Encrypting user ID.
                            { id: user.id },
                            config.get('JWT_SECRET'),
                            { expiresIn: 3600 }, // 1 Hour
                            (err, token) => {
                                if (err) throw err;

                                // If there ain't any issue, returning token & user data.
                                res.json({
                                    token,
                                    user: {
                                        id: user.id,
                                        name: user.username,
                                        email: user.email,
                                        isEmailVerified: user.isEmailVerified,
                                        userType: user.userType,
                                        isPlanChosen: false,
                                        isPaymentVerified: false
                                    }
                                });
                            }
                        )
                    }

                    user.save(((err) => {
                        if (err) console.log('Error while storing social user details!', err);
                    }));

                }

            } else {
                res.json({

                    user: {
                        isEmailVerified: payload.email_verified,
                        isBusinessAdded: data[0].isBusinessAdded,
                        isPlanSelected: data[0].isPlanSelected,
                        isPaymentReceived: data[0].isPaymentReceived,
                        isMwsVerified: data[0].isMwsVerified,
                        id: data[0].id,
                        username: data[0].username,
                        email: data[0].email,
                        userType: data[0].userType,
                        planDetails: data[0].planDetails,
                        businessInfo: data[0].businessInfo,
                        SellerID: data[0].SellerID,
                        MwsToken: data[0].MwsToken,
                        accessKeyId: data[0].accessKeyId,
                        accessSecret: data[0].accessSecret,
                        Marketplace: data[0].Marketplace
                    }
                })
            }

        }).catch((error) => {
            console.log('Error while fetching user email data ==> ', error);
        })

    }

    // Checking for errors while auth from google's server
    verify().catch(console.error);
}


// Function for Facebook Authentication
module.exports.facebookLogin = (req, res, next) => {

    // Fetching userdata from frontend.
    const { facebookToken, username, email, picture, plan } = req.body;

    console.log('Facebook Route Hit ==> ', req.body);

    User.findOne({ email })

        .then((user) => {

            console.log('Checking Facebook User response ==> ', user);

            if (user === null) {

                // Using Facebook's Graph API to authenticate the token.
                var graphAuthPath = `https://graph.facebook.com/me?access_token=${facebookToken}`

                // Using 'Request' module to make server side request to remote server.
                Request.get(graphAuthPath, (error, response, body) => {

                    // Retrieving status code from Graph Api's response.
                    const { statusCode } = response;

                    // If the access token has been authenticated.
                    if (statusCode === 200) {

                        // Creating instance of the user model.
                        var user = new User();

                        // If plan details exist in request body.
                        if (plan !== null && plan !== undefined) {

                            // Storing authenticated user details in DB.
                            user.username = username;
                            user.email = email;
                            user.profilePicture = picture;
                            user.isEmailVerified = true;
                            user.status = 'active';
                            user.role = 'seller';
                            user.userType = 'viaFacebook';
                            user.planDetails.planSelected = plan.name;
                            user.planDetails.planDescription = plan.description;
                            user.planDetails.servicesIncluded = plan.service;
                            user.planDetails.planDuration = plan.time;
                            user.planDetails.planPrice = plan.price;
                            user.planDetails.planCurrency = plan.currency;
                            user.isPlanSelected = true;

                            // Creating JWT token.
                            jwt.sign(
                                { id: user.id },
                                config.get('JWT_SECRET'),
                                { expiresIn: 3600 },
                                (err, token) => {
                                    if (err) throw err;

                                    // If there ain't any issue, returning token & user data.
                                    res.json({
                                        token,
                                        user: {
                                            id: user.id,
                                            name: user.username,
                                            email: user.email,
                                            isEmailVerified: user.isEmailVerified,
                                            userType: user.userType,
                                            plan: user.planDetails,
                                            isPlanChosen: true,
                                            isPaymentVerified: false
                                        }
                                    });
                                }
                            )

                            // if details doesn't exist in request body.
                        } else {
                            // Storing authenticated user details in DB.
                            user.username = username;
                            user.email = email;
                            user.profilePicture = picture;
                            user.isEmailVerified = true;
                            user.status = 'active';
                            user.role = 'seller';
                            user.userType = 'viaFacebook';

                            // Creating JWT token.
                            jwt.sign(
                                { id: user.id },
                                config.get('JWT_SECRET'),
                                { expiresIn: 3600 },
                                (err, token) => {
                                    if (err) throw err;

                                    // If there ain't any issue, returning token & user data.
                                    res.json({
                                        token,
                                        user: {
                                            id: user.id,
                                            name: user.username,
                                            email: user.email,
                                            isEmailVerified: user.isEmailVerified,
                                            userType: user.userType,
                                            isPlanChosen: false,
                                            isPaymentVerified: false
                                        }
                                    });
                                }
                            )
                        }

                        user.save(((err) => {
                            if (err) console.log(err);
                        }));

                    } else {
                        // In case, the authentication with Graph API fails.
                        res.json({ message: 'Error connecting to Facebook!' })
                    }
                });

            } else {

                res.json({

                    user: {
                        isEmailVerified: user.isEmailVerified,
                        isBusinessAdded: user.isBusinessAdded,
                        isPlanSelected: user.isPlanSelected,
                        isPaymentReceived: user.isPaymentReceived,
                        isMwsVerified: user.isMwsVerified,
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        userType: user.userType,
                        planDetails: user.planDetails,
                        businessInfo: user.businessInfo,
                        SellerID: user.SellerID,
                        MwsToken: user.MwsToken,
                        accessKeyId: user.accessKeyId,
                        accessSecret: user.accessSecret,
                        Marketplace: user.Marketplace
                    }
                })

            }

        }).catch((err) => {
            console.log('Error while finding ==> ', err);
        })

}