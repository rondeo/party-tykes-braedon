const mongoose = require("mongoose");
const User = mongoose.model('User');
const localStorage = require('localStorage');

module.exports.addBusinessInfo = (req, res, next) => {

    const { businessName, productCategory, address, businessTagline, email } = req.body;

    if (!businessName || !productCategory || !address || !businessTagline) {
        return res.status(400).json({ message: 'All fields are mandatory!', success: false });
    }

    User.update({ 'email': email }, {

        $set: {
            'isBusinessAdded': true,
            'businessInfo.businessName': businessName,
            'businessInfo.productCategory': productCategory,
            'businessInfo.address': address,
            'businessInfo.businessTagline': businessTagline
        }

    }).then(() => {
        res.json({ message: 'Business Info Updated!', success: true });
    }).catch(err => {
        res.json({ message: 'Error while updating business info!', success: false });
    });

    localStorage.removeItem('paymentStatus');
}