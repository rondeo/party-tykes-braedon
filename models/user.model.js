const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

var userSchema = new mongoose.Schema({
    username: {
        type: String,
    },
    email: {
        type: String,
        unique: true,
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    password: {
        type: String,
    },
    status: {
        type: String,
        default: 'active'
    },
    userType: {
        type: String
    },
    role: {
        type: String,
        default: 'seller'
    },
    profilePicture: {
        type: String
    },
    created: {
        type: Date,
        default: Date.now
    },
    reset_password_token: {
        type: String
    },
    AmazonUID: {
        type: String
    },
    Amazon_RefreshToken: {
        type: String
    },
    reset_password_expires: {
        type: Date
    },
    SellerID: {
        type: String
    },
    MwsToken: {
        type: String
    },
    accessKeyId: {
        type: String
    },
    accessSecret: {
        type: String
    },
    Marketplace: {
        type: String
    },
    saltSecret: String,

    businessInfo: {
        businessName: { type: String },
        productCategory: { type: String },
        address: { type: String },
        businessTagline: { type: String }
    },

    isBusinessAdded: { type: Boolean, default: false },

    isPlanSelected: { type: Boolean, default: false },

    isPaymentReceived: { type: Boolean, default: false },

    isMwsVerified: { type: Boolean, default: false },

    AccessSecret: String,

    AccessKey: String,

    planDetails: {
        planSelected: { type: String },
        planDescription: { type: String },
        servicesIncluded: { type: String },
        planDuration: { type: String },
        planPrice: { type: String },
        planCurrency: { type: String },
        isPaymentVerified: { type: Boolean },
        transactionId: { type: String }
    }

});

// Custom validation for email
// userSchema.path('email').validate((val) => {
//     emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
//     return emailRegex.test(val);
// }, 'Invalid e-mail.');

// Events
userSchema.pre('save', function (next) {
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(this.password, salt, (err, hash) => {
            this.password = hash;
            this.saltSecret = salt;
            next();
        });
    });
});

// Methods
userSchema.methods.verifyPassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

// userSchema.methods.generateJwt = function () {
//     return jwt.sign({ _id: this._id },
//         process.env.JWT_SECRET,
//         {
//             expiresIn: process.env.JWT_EXP
//         });
// }

mongoose.model('User', userSchema);
