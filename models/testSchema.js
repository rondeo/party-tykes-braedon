const mongoose = require('mongoose');

const testSchema = mongoose.Schema({
	value : String,
	sellerObjectId: String
});

module.exports = mongoose.model('testCron', testSchema);