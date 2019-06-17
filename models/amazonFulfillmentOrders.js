const mongoose = require('mongoose');

const AmazonFulfillmentSchema = mongoose.Schema({
  AmazonOrderId: { type: String, unique: true },
  userid: String,
  SellerFulfillmentOrderId: { type: String, unique: true },
  DisplayableOrderDateTime: String,
  ShippingSpeedCategory: String,
  FulfillmentMethod: String,
  FulfillmentOrderStatus: String,
  FulfillmentPolicy: String,
  StatusUpdatedDateTime: String,
  ReceivedDateTime: String,
  DisplayableOrderId: String,
  DisplayableOrderComment: String,
  DestinationAddress: Object
});

module.exports = mongoose.model('amazonFulfillments', AmazonFulfillmentSchema);
