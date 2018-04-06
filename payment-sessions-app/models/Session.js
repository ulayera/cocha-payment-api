const mongoose = require('mongoose');

let schema = new mongoose.Schema({
  lockId: String, //represents the browser cookie to avoid multiple users paying the same session
  successUrl: String, // url to redirect in case of successful payment
  errorUrl: String, // url to redirect in case of unsuccessful payment
  name: String, //person name for contact purposes (who created the session)
  mail: String, //person mail for contact purposes (who created the session)
  source: String, // ?
  status: String, //calculated current status
  // totalPaid: Number, //represents the amount paid until now (get updated each time there's a successful charge)
  // total: Number, //represents the total amount *for this product* (value keeps the same from start to end)
  products: [{
    cpnr: String, //supplier product id
    xpnr: String, //cocha modified supplier product id
    currency: String, //currency code
    amountsType: String, // ['free', 'fixed']
    // totalPaid: Number, //represents the amount paid until now (get updated each time there's a successful charge)
    // total: Number, //represents the total amount *for this product* (value keeps the same from start to end)
    amounts: [{ //represents an atomic, undivisible amount to pay
      name: String, //name of the amount (i.e: "Ticket 1 SCL - LIM, Asiento E13"), for description purposes
      value: Number, //value in CLP of the amount
      currency: String, //currency code
      isPaid: Boolean, //true=paid, false=unpaid
    }],
  }]
});

module.exports = {
  model: mongoose.model('Session', schema, 'session'),
};