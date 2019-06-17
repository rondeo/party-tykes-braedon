const mongoose = require('mongoose');

const serviceSchema = mongoose.Schema({
	user_id: String,
    name: String,
    description: String,
    status: String
});

module.exports = mongoose.model('services', serviceSchema);