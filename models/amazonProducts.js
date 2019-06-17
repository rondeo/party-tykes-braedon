const mongoose = require('mongoose');
const Schema = mongoose.Schema

const AmazonProductsSchema = mongoose.Schema({
  ASIN: { type: String, unique: true },
  accessKeyId: String,
  accessSecret: String,
  userid: String,
  ProductName: String,
  sellerObjectId: String,
  ProductDesc: String,
  PostedDate: String,
  userid: String,
  AvailableQuantity: Number,
  Units: Number,
  SKU: String,
  SellerSKU: { type: String, unique: true },
  value: [String],
  Principal: { type: Number, default: 0 },
  title: { type: String, default: '' },
  brand: { type: String, default: ''},
  PrincipalCurrency: { type: String, default: 'USD' },
  ShippingCharge: { type: Number, default: 0 },
  ShippingChargeCurrency: { type: String, default: 'USD' },
  FBA: { type: Number, default: 0 },
  FBACurrency: { type: String, default: 'USD' },
  ReferralFee: { type: Number, default: 0 },
  ReferralFeeCurrency: { type: String, default: 'USD' },

  sampleFee: { type: Number, default: 0 },
  sampleFeeCurrency: { type: String, default: 'USD' },
  setupFee: { type: Number, default: 0 },
  setupFeeCurrency: { type: String, default: 'USD' },
  inspectionFee: { type: Number, default: 0 },
  inspectionFeeCurrency: { type: String, default: 'USD' },
  miscFee: { type: Number, default: 0 },
  miscFeeCurrency: { type: String, default: 'USD' },


  Principal: Number,
  PrincipalCurrency: String,
  ShippingCharge: Number,
  ShippingChargeCurrency: String,
  FBA: Number,
  FBACurrency: String,
  ReferralFee: Number,
  ReferralFeeCurrency: String,

  sampleFee: Number,
  sampleFeeCurrency: String,
  setupFee: Number,
  setupFeeCurrency: String,
  inspectionFee: Number,
  inspectionFeeCurrency: String,
  miscFee: Number,
  miscFeeCurrency: String,
  finalPrice: Number,
  finalPriceCurrency: String,



  productCost: Number,
  productCostCurrency: String,
  feeTotal: Number,
  feeTotalCurrency: String,
  orderAndStagingFee: Number,
  orderAndStagingFeeCurrency: String,
  shippingTotal: Number,
  shippingTotalCurrency: String,
  landedOrder: Number,
  landedOrderCurrency: String,
  landedAvgCost: Number,
  landedAvgCostCurrency: String,
  fulfilledUnitCost: Number,
  fulfilledUnitCostCurrency: String,
  amznFeePerOrder: Number,
  amznFeePerOrderCurrency: String,
  
  buycost: String,


});

module.exports = mongoose.model('amazonproducts', AmazonProductsSchema);
