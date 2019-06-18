const mongoose = require('mongoose');
const _ = require('lodash');
var nodemailer = require('nodemailer');
const async = require('async');
var crypto = require('crypto');
const User = mongoose.model('User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const senderEmail = config.get('SENDER_EMAIL');
const senderPassword = config.get('SENDER_PASSWORD');
const accessKey = config.get('MWS_ACCESS_KEY');
const accessSecret = config.get('MWS_ACCESS_SECRET');
const amazonMws = require('amazon-mws')(accessKey, accessSecret);
const querystring = require('querystring');
const localStorage = require('localStorage');
const nodemailerSmtpTransport = require("nodemailer-smtp-transport");
const path = require('path');
const ejs = require("ejs");
const fs = require("fs");

// Controller for user authentication.
module.exports.authenticate = (req, res, next) => {

    // Using destructuring to fetch data from req.body
    const { email, password } = req.body;

    console.log('Authenticate Route Hit ==> ', req.body);

    //x------------x------------FRONT END REQUEST-------------x-------------x
    if (!("origin" in req.body) == 0) {
        // Testing if the body is empty
        if (!email || !password) {
            return res.status(400).json({ message: 'All fields are mandatory.' });
        }

        // Finding user by email from DB
        User.findOne({ email })
            .then(user => {
                // If email is not registered in DB
                if (!user) return res.status(404).json({ message: 'Email doesnt exist.' });

                if (user.userType === 'viaGoogle') return res.status(401).json({ message: 'This email address has been associated with a google account. Please sign in with google to continue.' })

                if (user.userType === 'viaFacebook') return res.status(401).json({ message: 'This email address has been associated with a Facebook account. Please login with facebook to continue.' })

                if (user.userType === 'backRegisteration') return res.status(401).json({ message: 'This email address belongs to the admin panel. Please try to log in to admin panel using this email address' })

                // Password validation
                bcrypt.compare(password, user.password)
                    .then(isMatch => {
                        // If the password is incorrect
                        if (!isMatch) {
                            return res.status(401).json({ message: 'Invalid password' });
                        }
                        // If everything is fine!
                        jwt.sign(
                            {
                                id: user.id,
                                email: user.email,
                                sellerId: user.SellerID,
                                mwsToken: user.MwsToken,
                                marketplaceId: user.Marketplace,
                                accessKey: user.accessKeyId,
                                accessSecret: user.accessSecret
                            },
                            config.get('JWT_SECRET'),
                            // { expiresIn: 3600 },
                            (err, token) => {
                                console.log(token);
                                if (err) throw err;
                                res.json({
                                    token,
                                    user: user
                                });
                            }
                        )
                    })
            })
        //x--------------x--------------BACKEND REQUEST---------------x-----------------x
    } else {

        // Finding user by email, setting session values & redirecting to dashboard.
        User.findOne({ email })
            .then(user => {

                // If there's no email/password received.
                if (!email || !password) {
                    req.flash('error_msg', 'All fields are mandatory.');
                    res.redirect('/');
                }

                // If user doesn't exist.
                if (!user) {
                    req.flash('error_msg', 'That email is not registered');
                    res.redirect('/');
                }

                // If the user is a seller.
                if (user.role == "seller") {
                    req.flash('error_msg', 'You are not authorized to login the account');
                    res.redirect('/');
                }

                // If user status is inactive.
                if (user.status == 'inactive' && (user.role == "superadmin" || user.role == "admin")) {
                    req.flash('error_msg', 'Your account is in-active. Please contact the support');
                    res.redirect('/');
                }

                // If user status is active & his role is admin/superadmin.
                if (user.status == 'active' && (user.role == "superadmin" || user.role == "admin")) {

                    // Match password
                    bcrypt.compare(password, user.password, (err, isMatch) => {

                        if (err) throw err;
                        if (isMatch) {

                            // Setting up session values to be used throughout the application.
                            req.session.name = user.username;
                            req.session.email = user.email;
                            req.session.role = user.role;
                            req.session.userid = user._id;
                            req.session.SellerID = user.SellerID;
                            req.session.MwsToken = user.MwsToken;
                            req.session.Marketplace = user.Marketplace;
                            req.session.AccessKey = user.AccessKey;
                            req.session.AccessSecret = user.AccessSecret;
                            req.session.password = user.password;
                            req.session.userType = user.userType;

                            // Redirecting to the dashboard is everything goes fine.
                            res.redirect('/dashboard/show-dashboard');

                        } else {
                            req.flash('error_msg', 'Password incorrect');
                            res.redirect('/');
                        }
                    });
                }
            });
    }
}

// Controller for user registeration.
module.exports.register = (req, res, next) => {

    // Using destructuring to fetch data from req.body
    const { username, email, password, status, role, plan } = req.body;

    console.log('Register Route Hit! ==> ', req.body);

    //x-----------x-----------FRONTEND REQUEST----------x-----------x
    if (!("origin" in req.body) == 0) {

        console.log('REQUEST FROM F.E', req.body);

        // Testing if the body is empty
        if (!username || !email || !password || !status || !role) {
            return res.status(400).json({ message: 'All fields are mandatory.' });
        }

        else if (password.length < 6) {
            return res.status(404).json({ message: 'Password should be atleast 6 characters long.' })
        }

        localStorage.setItem('frontEndUser', email);

        // Checking for existing user
        User.findOne({ email })

            .then(user => {

                // If user already exists.
                if (user.userType === 'viaGoogle') return res.status(400).json({ message: 'This email address is already associated to a google account with us. Please sign in through google to continue.' })
                if (user.userType === 'viaFacebook') return res.status(400).json({ message: 'This email address is already associated to a facebook account with us. Please sign in through facebook to continue.' })
                if (user) return res.status(409).json({ message: 'This email has already been registered' });

                const newUser = new User();

                // If there's a plan in the request body.
                if (plan !== null && plan !== undefined) {

                    newUser.username = username;
                    newUser.email = email;
                    newUser.password = password;
                    newUser.status = status;
                    newUser.role = role;
                    newUser.userType = 'viaFrontRegisteration';
                    newUser.planDetails.planSelected = plan.name;
                    newUser.planDetails.planDescription = plan.description;
                    newUser.planDetails.servicesIncluded = plan.service;
                    newUser.planDetails.planDuration = plan.time;
                    newUser.planDetails.planPrice = plan.price;
                    newUser.planDetails.planCurrency = plan.currency;
                    newUser.isPlanSelected = true;

                    newUser.save()
                        .then(user => {
                            jwt.sign(
                                {
                                    id: user.id,
                                    email: user.email,
                                    sellerId: user.SellerID,
                                    mwsToken: user.MwsToken,
                                    marketplaceId: user.Marketplace,
                                    accessKey: user.accessKeyId,
                                    accessSecret: user.accessSecret
                                },
                                config.get('JWT_SECRET'),
                                // { expiresIn: 3600 },
                                (err, token) => {
                                    if (err) throw err;

                                    async.waterfall([

                                        function (done) {

                                            User.findOne({
                                                email: email
                                            }).exec(function (err, user) {

                                                if (user) {

                                                    done(err, user);
                                                } else {
                                                    done('User not found.');
                                                }
                                            });
                                        },
                                        function (user, done) {

                                            var token = Math.floor(100000 + Math.random() * 900000);

                                            done(err, user, token);

                                        },
                                        function (user, token, done) {

                                            User.findByIdAndUpdate({ _id: user._id }, { reset_password_token: token, reset_password_expires: Date.now() + 86400000 }, { upsert: true, new: true }).exec(function (err, new_user) {
                                                done(err, token, new_user);

                                            });

                                        },
                                        function (token, user, done) {

                                            const transporter = nodemailer.createTransport({
                                                service: 'gmail',
                                                auth: {
                                                    user: senderEmail,
                                                    pass: senderPassword,
                                                },
                                            });

                                            const mailOptions = {
                                                from: senderEmail,
                                                to: user.email,
                                                html: `<p>${token}</p>`
                                            };

                                            transporter.sendMail(mailOptions, (err, info) => {
                                                if (err) { console.log(err); } else { res.send('Email sent successfully!') }
                                            });
                                        }
                                    ], function (err) {
                                        return res.status(422).json({ message: err });
                                    });

                                    res.json({
                                        token,
                                        user: {
                                            id: user.id,
                                            name: user.username,
                                            email: user.email,
                                            status: user.status,
                                            role: user.role,
                                            isEmailVerified: user.isEmailVerified,
                                            plan: user.planDetails,
                                            isPlanChosen: true,
                                            isPaymentVerified: false
                                        }
                                    });

                                });
                        });

                }

                // If there's no plan in the request body.
                else {

                    newUser.username = username;
                    newUser.email = email;
                    newUser.password = password;
                    newUser.status = status;
                    newUser.role = role;
                    newUser.userType = 'viaFrontRegisteration';

                    newUser.save()
                        .then(user => {
                            jwt.sign(
                                { id: user.id },
                                config.get('JWT_SECRET'),
                                // { expiresIn: 3600 },
                                (err, token) => {
                                    if (err) throw err;

                                    async.waterfall([

                                        function (done) {

                                            User.findOne({
                                                email: email
                                            }).exec(function (err, user) {

                                                if (user) {

                                                    done(err, user);
                                                } else {
                                                    done('User not found.');
                                                }
                                            });
                                        },
                                        function (user, done) {

                                            var token = Math.floor(100000 + Math.random() * 900000);

                                            done(err, user, token);

                                        },
                                        function (user, token, done) {

                                            User.findByIdAndUpdate({ _id: user._id }, { reset_password_token: token, reset_password_expires: Date.now() + 86400000 }, { upsert: true, new: true }).exec(function (err, new_user) {
                                                done(err, token, new_user);

                                            });

                                        },
                                        function (token, user, done) {

                                            const transporter = nodemailer.createTransport({
                                                service: 'gmail',
                                                auth: {
                                                    user: senderEmail,
                                                    pass: senderPassword,
                                                },
                                            });

                                            const mailOptions = {
                                                from: senderEmail,
                                                to: user.email,
                                                html: `<p>${token}</p>`
                                            };

                                            transporter.sendMail(mailOptions, (err, info) => {
                                                if (err) { console.log(err); } else { res.send('Email sent successfully!') }
                                            });
                                        }
                                    ], function (err) {
                                        return res.status(422).json({ message: err });
                                    });

                                    res.json({
                                        token,
                                        user: {
                                            id: user.id,
                                            name: user.username,
                                            email: user.email,
                                            status: user.status,
                                            role: user.role,
                                            isEmailVerified: user.isEmailVerified,
                                            isPlanChosen: false,
                                            isPaymentVerified: false
                                        }
                                    });

                                });
                        });
                }


            });

        //x----------x---------BACKEND REQUEST----------x-----------x

    } else {

        console.log('REQUEST FROM B.E')

        const param = {
            useremail: email
        };

        const stringified = querystring.stringify(param);

        var user = new User();
        user.username = username;
        user.email = email;
        user.password = password;
        user.status = status;
        user.role = role;
        user.userType = 'backRegisteration'

        user.save((err, doc) => {
            if (!err)
                res.redirect('/auth/get-credentials' + '?' + stringified);
            else {
                if (err.code == 11000)
                    res.status(422).send(['Duplicate email adrress found.']);
                else
                    return next(err);
            }
        });

        //NODEMAILER

        var readHTMLFile = function (path, callback) {
            fs.readFile(path, {
                encoding: 'utf-8'
            }, function (err, html) {
                if (err) {
                    throw err;
                    callback(err);
                } else {
                    callback(null, html);
                }
            });
        };

        readHTMLFile(__dirname + '/template/html.ejs', function (err, html) {
            console.log(__dirname);
            var template = ejs.compile(html);
            var replacements = {
                username: user.email,
                name: user.username
            };
            var htmlToSend = template(replacements);
            let smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: senderEmail,
                    pass: senderPassword,
                },
            });
            var mailOptions = {
                from: senderEmail,
                to: user.email,


                subject: "Braedon Registration ✔",
                html: htmlToSend // html body
            };
            smtpTransport.sendMail(mailOptions, function (error, response) {
                if (error) {
                    console.log(error);

                }
            });
        });
    }
};

// Controller for rendering signup page.
module.exports.signup = (req, res, next) => {
    res.render('users/register-user', { layout: 'frontend' });
}

// Controller for fetching current user profile.
module.exports.userProfile = (req, res, next) => {
    User.findOne({ _id: req._id },
        (err, user) => {
            if (!user)
                return res.status(404).json({ status: false, message: 'User record not found.' });
            else
                // return res.status(200).json({ status: true, user: _.pick(user, ['username', 'email']) });
                return res.status(200).json({ status: true, user: user });
        }
    );
}

// Controller for loggin an user out.
module.exports.logoutFunction = (req, res, next) => {
    req.session.reset();
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/');
}

// Controller for forgot password page rendering.
module.exports.resetPassword = (req, res, next) => {
    res.render('users/forgotpassword', { layout: 'frontend' });
}

// Controller for email submission for recovering account.
module.exports.submitEmail = (req, res, next) => {
    async.waterfall([
        function (done) {
            User.findOne({
                email: req.body.email
            }).exec(function (err, user) {
                if (user) {
                    done(err, user);
                } else {
                    done('User not found.');
                }
            });
        },
        function (user, done) {

            // create the random token
            crypto.randomBytes(20, function (err, buffer) {
                var token = buffer.toString('hex');
                done(err, user, token);
            });
        },
        function (user, token, done) {

            User.findByIdAndUpdate({ _id: user._id }, { reset_password_token: token, reset_password_expires: Date.now() + 86400000 }, { upsert: true, new: true }).exec(function (err, new_user) {
                done(err, token, new_user);
            });
        },
        function (token, user, done) {

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: senderEmail,
                    pass: senderPassword,
                },
            });

            const mailOptions = {
                from: senderEmail,
                to: user.email,
                subject: 'Password Recovery',
                html: 'http://localhost:4000/auth/reset-password?token=' + token
            };

            transporter.sendMail(mailOptions, (err, info) => {
                if (err) { console.log(err); } else { res.send('Email sent successfully!') }
            });
        }
    ], function (err) {
        return res.status(422).json({ message: err });
    });
}

// Controller for resetting new password page rendering.
module.exports.resetNewPassword = (req, res, next) => {
    res.render('users/reset-new-password', { layout: 'frontend', mytoken: req.query.token });
}

// Controller for resetting password & storing it in DB.
module.exports.saveNewPassword = (req, res, next) => {

    User.findOne({
        reset_password_token: req.body.tok,
        reset_password_expires: {
            $gt: Date.now()
        }
    }).exec(function (err, user) {
        if (!err && user) {
            if (req.body.pass1 === req.body.pass2) {
                user.password = req.body.pass1;

                user.reset_password_token = undefined;
                user.reset_password_expires = undefined;

                user.save(function (err) {
                    if (err) {
                        return res.status(422).send({
                            message: err
                        });
                    } else {

                        const transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                                user: senderEmail,
                                pass: senderPassword,
                            },
                        });

                        var data = {
                            from: senderEmail,
                            to: user.email,
                            subject: 'Password Reset Confirmation',
                            html: `name: ${user.username}`
                        };

                        transporter.sendMail(data, function (err) {
                            if (!err) {
                                return res.json({ message: 'Password reset' });
                            } else {
                                return done(err);
                            }
                        });
                    }
                });

            } else {
                return res.status(422).send({
                    message: 'Passwords do not match'
                });
            }
        } else {
            return res.status(400).send({
                message: 'Password reset token is invalid or has expired.'
            });
        }
    });
}

// Controller for setting up MWS credentials page rendering.
module.exports.getCredentials = (req, res, next) => {
    res.render('amazon/getCredentials', { layout: 'frontend', email: req.query.useremail });
}

// Controller for skipping the mws credentials page momentarily.
module.exports.skipCredentials = (req, res, next) => {
    req.flash('success_msg', 'User successfully registered.');
    res.redirect('/');
}

// Controller for submitting mws credentials.
module.exports.submitCredentials = (req, res, next) => {
    console.log('submitttttttttttttt');
    console.log("IDDD", req.body.SellerID)
    const accessKey = req.session.AccessKey;
    const accessSecret = req.session.AccessSecret;
    const amazonMws = require('amazon-mws')(accessKey, accessSecret);
    const param = {
        useremail: req.body.emailid
    };

    const stringified = querystring.stringify(param);

    amazonMws.feeds.search({
        'Version': '2009-01-01',
        'Action': 'GetFeedSubmissionList',
        'SellerId': req.body.SellerID,
        'MWSAuthToken': req.body.Token,
    }, function (error, response) {
        if (error) {
            console.log('error', error);
            req.flash('error_msg', 'sorry! You are entering wrong credentials.');
            res.redirect('/auth/get-credentials' + '?' + stringified);
            return;
        }

        User.update({ 'email': req.body.emailid },
            {
                $set: {
                    'SellerID': req.body.SellerID,
                    'MwsToken': req.body.MwsToken,
                    'Marketplace': req.body.Marketplace,
                    'AccessKey': req.body.AccessKey,
                    'isMwsVerified' : true,
                    'AccessSecret': req.body.AccessSecret
                }
            }, (err) => {
                if (err) {
                    console.log(err);
                }
                console.log('DATA UPDATED!');
            });
        req.flash('success_msg', 'You are successfully registered.');
        res.redirect('/');
    });
}