const mongoose = require('mongoose');

const plansSchema = mongoose.Schema({
  user_id: String,
  name: String,
  price: String,
  currency:{type : String, default : '$'},
  time: String,
  service: String,
  status: String,
  description: String
});

module.exports = mongoose.model('plans', plansSchema);
