const mongoose = require('mongoose');
const User = mongoose.model('User');
const jwt = require('jsonwebtoken');
const config = require('config');
var Request = require("request");
const { OAuth2Client } = require('google-auth-library');
const googleClientID = config.get('GOOGLE_CLIENT_ID');
const client = new OAuth2Client(googleClientID);

module.exports.googleLogin = (req, res) => {

    // Fetching token from req.body
    const { googleToken, plan } = req.body;

    async function verify() {

        const ticket = await client.verifyIdToken({
            idToken: googleToken,
            audience: googleClientID
        });

        const payload = ticket.getPayload();

        const required_email = payload.email

        User.findOne({ required_email })
            .then((user) => {

                if (user === null) {

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

                    } else {
                        res.status(402).json({ message: 'This user is not verified by google!' })
                    }

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
            })
    }

    verify().catch(console.error);
}


// Function for Facebook Authentication
module.exports.facebookLogin = (req, res, next) => {

    // Fetching userdata from frontend.
    const { facebookToken, username, email, picture, plan } = req.body;

    console.log('Facebook Route Hit ==> ', req.body);

    User.findOne({ email })

        .then((user) => {

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