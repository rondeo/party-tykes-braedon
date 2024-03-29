const mongoose = require('mongoose');

const AmazonOrdersSchema = mongoose.Schema({
  AmazonOrderID: { type: String, unique: true },
  ProductName: String,
  idmatch: String,
  userid: String,
  ProductDesc: String,
  PostedDate: String,
  Quantity: Number,
  OrderStatus: String,
  BuyerName: String,
  BuyerEmail: String,
  BuyerAddress: {
    AddressLine1: { type: String },
    Name: { type: String },
    CountryCode: { type: String },
    StateOrRegion: String,
    isAddressSharingConfidential: { type: String },
    PostalCode: { type: String },
    City: { type: String }
  },
  IsReplacementOrder: String,
  fulfilledBy: String,
  fulfillmentCreated : {type : Boolean},
  OrderItemId: String,
  PackageNumber : String,
  currentOrderStatus : String,

  PurchaseDate: String,
  PurchaseDateISO: String,

  QuantityOrdered: Number,
  QuantityShipped: Number,
  OrderTotal: Number,
  OrderTotalCurrency: String,
  ProductTitle: String,
  SellerSKU: String,
  ASIN: String,
  ItemPrice: Number,
  ItemPriceCurrency: String,
  ItemTax: Number,
  ItemTaxCurrency: String,
  ShippingPrice: Number,
  ShippingPriceCurrency: String,
  ShippingDiscount: Number,
  ShippingDiscountCurrency: String,
  Principal: Number,
  PrincipalCurrency: String,
  Tax: Number,
  TaxCurrency: String,
  GiftWrap: Number,
  GiftWrapCurrency: String,
  GiftWrapTax: Number,
  GiftWrapTaxCurrency: String,
  ShippingCharge: Number,
  ShippingChargeCurrency: String,
  ShippingTax: Number,
  ShippingTaxCurrency: String,

  FBAPerOrderFulfillmentFee: Number,
  FBAPerOrderFulfillmentFeeCurrency: String,
  FBAPerUnitFulfillmentFee: Number,
  FBAPerUnitFulfillmentFeeCurrency: String,
  FBAWeightBasedFee: Number,
  FBAWeightBasedFeeCurrency: String,
  Commission: Number,
  CommissionCurrency: String,
  FixedClosingFee: Number,
  FixedClosingFeeCurrency: String,
  GiftwrapChargeback: Number,
  GiftwrapChargebackCurrency: String,
  SalesTaxCollectionFee: Number,
  SalesTaxCollectionFeeCurrency: String,
  ShippingChargeback: Number,
  ShippingChargebackCurrency: String,
  idmatch: { type:String, ref: 'amazonproducts', autopopulate: true },
  buycost: Number
});

module.exports = mongoose.model('amazonOrders', AmazonOrdersSchema);
