var mongoose = require('mongoose');

var reimbursementsSchema = mongoose.Schema({
      approvaldate: {unique: true, type : String },
      amazonOrderId: String,
      userid: String,
      sku: String,
      productname: String,
      reimbursementId: String,
      amountperUnit: String,
      currencyUnit: String,
      quantityReimbursedCash: String,
      quantityReimbursedInventory: String,
      quantityReimbursedTotal: String, 
      reason: String
});




module.exports = mongoose.model("reimbursements", reimbursementsSchema);