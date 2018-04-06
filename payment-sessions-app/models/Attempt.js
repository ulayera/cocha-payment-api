var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  sessionId: String, //id of the session this attempt belongs
  method: String, //payment method selected for this attempt; see in config/[environment].js codes.method
  currency: String, //currency code
  amount: Number, //this attempt's amount value
  date: Date, //creation date
  transaction_type: String, // see in config/[environment].js codes.type
  status: String, // current status of this attempt, may be updated upon getting the attempt results
  info: mongoose.Schema.Types.Mixed // carried data
});

module.exports = {
  model: mongoose.model('Attempt', schema, 'attempt'),
};