var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  sessionId: String, //id of the session this attempt belongs
  productId: String, //id of the product to pay
  amountId: String, //id of the product to pay
  method: String, //payment method selected for this attempt; see in config/[environment].js codes.method
  type: String, // see in config/[environment].js codes.type
  currency: String, //currency code
  amount: Number, //this attempt's amount value
  date: Date, //creation date
  status: String, // current status of this attempt, may be updated upon getting the attempt results
  info: mongoose.Schema.Types.Mixed // carried data
});

module.exports = {
  model: mongoose.model('Attempt', schema, 'attempt'),
};