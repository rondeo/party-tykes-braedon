const mongoose = require('mongoose');

const productFinderSchema = mongoose.Schema({
    productID: String,
    description: String,
    brand: String,
    color: String,
    label: String,
    price: Number,
    currency: String,
    model: { type: String, unique: true },
    size: String,
    quantity: Number,
    image: String,
    asin: String,
    rank: Number
});

module.exports = mongoose.model('productFinder', productFinderSchema);