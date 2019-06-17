const mongoose = require('mongoose');

var PageSchema = mongoose.Schema({
	user_id: String,
    name: String,
    PageSlug: String,
    content : String

});

module.exports = mongoose.model('pages', PageSchema);
