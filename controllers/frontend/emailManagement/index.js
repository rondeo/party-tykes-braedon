var nodemailer = require('nodemailer');
const mongoose = require("mongoose");
const User = mongoose.model('User');
const localStorage = require('localStorage');
const config = require('config');
const senderEmail = config.get('SENDER_EMAIL');
const senderPassword = config.get('SENDER_PASSWORD');


// OTP confirmation API for email verification of front end user.
module.exports.verifyOTP = (req, res, next) => {

    // Destructuring to fetch OTP from headers.
    const { otp } = req.body;

    // Fetching email of requstering user from "register" API.
    const email = localStorage.getItem('frontEndUser');

    // Searching for user with associated email.
    User.findOne({ email })
        .then(user => {
            // If the OTP in DB matches the OTP entered by front end user.
            if (user.reset_password_token === otp && otp !== null) {

                User.update({ 'email': email },
                    {
                        // Setting the email verified to true & tokens to null because of tokens'
                        // needlessness from here on.
                        $set: {
                            'isEmailVerified': true,
                            'reset_password_token': null,
                            'reset_password_expires': null
                        }
                    }, (err) => {
                        if (err) {
                            console.log(err);
                        }
                        // If the email has been successfully verified.
                        res.status(200).json({ message: 'Email has been verified!', otpSuccess: true });
                    });

                // Emptying the local Storage for the email is of no use further.
                // localStorage.removeItem('frontEndUser');

            } else {
                // If the OTP entered is incorrect.
                res.status(401).json({ message: 'Invalid OTP', otpSuccess: false })
            }
        })
}

// Resend OTP for front end user API for email verification.
module.exports.resendOTP = (req, res, next) => {

    // Destructuring to fetch email from request's body.
    const { email } = req.body;

    // Finding userdata associated with the provided email.
    User.findOne({ email: email })
        .then(res => {

            // Generating new OTP.
            var token = Math.floor(100000 + Math.random() * 900000);

            // Storing new OTP & its expiration time in DB.
            User.update({ 'email': email },
                {
                    $set: {
                        'reset_password_token': token,
                        'reset_password_expires': Date.now() + 86400000
                    }

                }, (err) => {
                    if (err) {
                        console.log(err);
                    }
                    // If the OTP has been saved successfully in DB.
                    console.log('Token reset!');
                })

            // Setting nodemailer service for sending email to the user.
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: senderEmail,
                    pass: senderPassword,
                },
            });

            // Setting mail options as to whom, from whom & what needs to be sent.
            const mailOptions = {
                from: senderEmail,
                to: email,
                html: `Resend Token Request : <p>${token}</p>`
            };

            // Sending the email taking in all the required parameters.
            transporter.sendMail(mailOptions, (err, info) => {
                if (err) { console.log(err); } else { res.send('Email sent successfully!') }
            });
        }).then(resp => {
            // If the OTP has been sent successfully.
            res.status(200).json({ message: 'OTP has been resent', resentOtp: true })
        }).catch(err => {
            // If an error occurs while sending OTP.
            res.status(401).json({ message: 'Error while resending OTP!', resentOtp: false })
        })
}