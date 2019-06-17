var nodemailer = require('nodemailer');
const mongoose = require("mongoose");
const User = mongoose.model('User');
const config = require('config');
const senderEmail = config.get('SENDER_EMAIL');
const senderPassword = config.get('SENDER_PASSWORD');
const localStorage = require('localStorage');

// Forgot Password API for frontend user.
module.exports.forgotPassword = (req, res, next) => {

    // Destructuring to fetch email from headers.
    const { email } = req.body;

    // Setting received email in localStorage to use it throughout the recovery process.
    localStorage.setItem('verificationEmail', email);

    // Server side validation for empty email field.
    if (email === null) {
        res.status(401).json({ message: 'This is a required field.' })
    }

    // Looking for user associated with provided email address.
    User.findOne({ email: email })
        .then(user => {

            // If the email is not associated with any account.
            if (!user) return res.status(400).json({ message: 'This email is invalid!', success : false })

            // If the email associated has been stored using Google Signin.
            else if (user.userType === 'viaGoogle') return res.status(403).json({ message: 'Google account cant!', success : false });

            // If the email associated has been stored using Facebook Login.
            else if (user.userType === 'viaFacebook') return res.status(403).json({ message: 'Facebook account cant!', success : false });

            // If there is no error, an OTP is generated.
            var token = Math.floor(100000 + Math.random() * 900000);

            // Storing OTP in database to be used further for verification.
            User.update({ 'email': email }, {
                $set: {
                    'reset_password_token': token,
                    'reset_password_expires': Date.now() + 86400000
                }
            }, (err) => {
                if (err) console.log(err);
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
                html: `OTP for resetting password : <p>${token}</p>`
            };

            // Sending the email taking in all the required parameters.
            transporter.sendMail(mailOptions, (err, info) => {
                if (err) { console.log(err); }
                else {
                    // If the email has been sent successfully.
                    res.status(200).json({ message: 'OTP sent successfully!', otpSent: true })
                }
            });
        }).catch(err => {
            // If an error arises while sending the OTP.
            res.status(401).json({ message: 'Error while sending OTP for password recovery.', otpSent: false })
        })
}

// OTP verification API for frontend user.
module.exports.verifyOTP = (req, res, next) => {

    // Destructuring to fetch OTP from request headers.
    const { otp } = req.body;

    // Fetching email of the user that was set in "forgotPassword" API. 
    const email = localStorage.getItem('verificationEmail');

    // Using the localStorage email to find the account associated with it.
    User.findOne({ email })
        .then(user => {

            if (user.reset_password_token === otp && otp !== null) {

                // If the OTP from the frontend user & the one stored in DB matches.
                res.status(200).json({ message: 'OTP has been confirmed!', otpSuccess: true })

            } else {

                // If the frontend user enters an invalid OTP.
                res.status(401).json({ message: 'Invalid OTP', otpSuccess: false })
            }
        })
}

// Reset Password API for front end user.
module.exports.resetPassword = (req, res, next) => {

    // Destructuring to fetch password & confirm password from request header.
    const { password, confirmPassword } = req.body;

    // Server side validation for password & confirm password being empty fields.
    if (password === null || confirmPassword === null) {
        res.status(400).json({ message: 'These fields are mandatory!', passwordReset: false })

        // Server side validation for password not matching the confirm password field.
    } else if (password !== confirmPassword) {
        res.status(401).json({ message: 'Password & Confirm Password do not match!', passwordReset: false })
    }

    // Fetching email of the user that had been set in "forgotPassword" API.
    const email = localStorage.getItem('verificationEmail');

    // Looking for account associated with the email address from local storage.
    User.findOne({ email })
        .exec((err, user) => {

            // Resetting new password provided by the front end user.
            user.password = password;
            user.save(((err) => {
                if (err) throw err;
                res.status(200).json({ message: 'Password has been reset successfully!', passwordReset: true })
            }))
        })

}