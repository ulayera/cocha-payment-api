const mongoose = require('mongoose');

let schema = new mongoose.Schema({
  lockId: String, //represents the browser cookie to avoid multiple users paying the same session
  wappOkUrl: String, // url to redirect in case of successful payment
  wappErrorUrl: String, // url to redirect in case of unsuccessful payment
  refCode : String,
  business : String,
  name: String, //person name for contact purposes (who created the session)
  mail: String, //person mail for contact purposes (who created the session)
  date: Date,
  toSplitAmount: { //internal logic usage object (reduces it's value until zero each time an amount is created)
    label: String, //name of the amount (i.e: "Ticket 1 SCL - LIM, Asiento E13"), for description purposes
    value: Number, //value in CLP of the amount
    currency: String, //currency code
    refCode : String,
  },
  amounts: [{ //represents an atomic, undivisible amount to pay
    name: String, //name of the amount (i.e: "Ticket 1 SCL - LIM, Asiento E13"), for description purposes
    value: Number, //value in CLP of the amount
    currency: String, //currency code
    isPaid: Boolean, //true=paid, false=unpaid
  }],
  descriptions : [
    {
      origin : String,
      destination : String,
      departureDate : String,
      returningDate : String,
      productType : String,
      adult : Number,
      child : Number,
      infant : Number,
      totalRooms : Number,
    }
  ],
  methodsFilter : [String],
  statuses : [{
    amountId: String, //id of the product to pay
    amount: Number, //this attempt's amount value
    method: String, //payment method selected for this attempt; see in config/[environment].js codes.method
    currency: String, //currency code
    date: Date, //creation date
    status: String, // current status of this attempt, may be updated upon getting the attempt results
    info: mongoose.Schema.Types.Mixed // carried data
  }]
});

module.exports = {
  model: mongoose.model('Session', schema, 'iterativeSession'),
};
