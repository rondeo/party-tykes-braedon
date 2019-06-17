const mongoose = require('mongoose');

const FulfillmentReturnSchema = mongoose.Schema({
  SellerFulfillmentOrderId: { type: String, unique: true },
  SubmissionDate: String,
  SellerFulfillmentOrderItemId: String,
  ReturnAuthorizationId : String,
  AmazonShipmentId: String,
  ReturnComment: String,
  StatusChangedDate: String,
  SellerReturnItemId: String,
  AmazonReturnReasonCode: String,
  Status: String,
  ReturnToAddress: [Object],
  AmazonRmaId: String,
  ReturnAuthorizationId: String,
  FulfillmentCenterId: String,
  RmaPageURL: String,
  userid: String
});

module.exports = mongoose.model('fulfillmentReturn', FulfillmentReturnSchema);
