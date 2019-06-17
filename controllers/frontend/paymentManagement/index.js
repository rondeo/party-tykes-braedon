const config = require("config");
const mongoose = require('mongoose');
const User = mongoose.model('User');
var nodemailer = require('nodemailer');
const senderEmail = config.get('SENDER_EMAIL');
const senderPassword = config.get('SENDER_PASSWORD');

// If payment has been done successfully via Paypal (For Seller).
module.exports.successfulPayment = (req, res, next) => {

    console.log('Payment Success Route Hit!', req.body);

    const { email, name, duration, price, currency, service, isPaymentVerified, transactionID } = req.body;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: senderEmail,
            pass: senderPassword,
        },
    });

    const mailOptions = {
        from: senderEmail,
        to: email,
        html: `<p>Order successful for purchase of plan ${name}
                     amounting to ${currency}${price}
                      for a duration of ${duration}. Your transaction id is ${transactionID}.</p>`
    };

    var promise1 = new Promise((resolve, reject) => {

        User.update({ 'email': email }, {

            $set: {
                planDetails: {
                    'planSelected': name,
                    'servicesIncluded': service,
                    'planDuration': duration,
                    'planPrice': price,
                    'planCurrency': currency,
                    'isPaymentVerified': isPaymentVerified,
                    'transactionId': transactionID
                },
                isPlanSelected: true,
                isPaymentReceived: true
            }
        }, (err) => {
            if (err) { console.log(err); }
            console.log('Payment Status Updated!');
        });

        resolve();
    });

    var promise2 = new Promise((resolve, reject) => {
        promise1.then(() => {
            transporter.sendMail(mailOptions, (err, info) => {
                if (err) { console.log(err); } else { console.log('Email sent successfully!') }
            });
        });
        resolve();
    });

    promise2.then(() => {
        res.json({ message: 'Payment has been received.', isPaymentVerified: true })
    })

}

// If the payment has been cancelled via Paypal (For seller).
module.exports.cancelledPayment = (req, res) => {

    const { email, name, duration, price, currency, service, isPaymentVerified, transactionID } = req.body;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: senderEmail,
            pass: senderPassword,
        },
    });

    const mailOptions = {
        from: senderEmail,
        to: email,
        html: `<p>We regret to inform you that your payment for the plan ${name}
                     amounting to ${currency}${price}
                      has failed. Please retry purchasing one.</p>`
    };

    var promise1 = new Promise((resolve, reject) => {
        User.update({ 'email': email }, {

            $set: {
                planDetails: {
                    'planSelected': name,
                    'servicesIncluded': service,
                    'planDuration': duration,
                    'planPrice': price,
                    'planCurrency': currency,
                    'isPaymentVerified': isPaymentVerified,
                    'transactionId': transactionID,
                },
                isPlanSelected: false,
                isPaymentReceived: false
            }
        }, (err) => {
            if (err) { console.log(err); }
            console.log('Payment Status Updated!');
        });
        resolve();
    })

    var promise2 = new Promise((resolve, reject) => {
        promise1.then(() => {
            transporter.sendMail(mailOptions, (err, info) => {
                if (err) { console.log(err); } else { res.send('Email sent successfully!') }
            });
        });
        resolve();
    });

    promise2.then(() => {
        res.status(500).json({ message: 'Payment has been failed!', isPaymentVerified: false })
    })


}