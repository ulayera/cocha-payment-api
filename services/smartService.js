'use strict';
/* jshint strict: false, esversion: 6 */

const Payment = require('../models/mongo/schemas/payment');

async function sendPayment() {
    var payment = new Payment({
        name: 'jackong',
        age: 17
    })
    var doc = await payment.save();
}

async function burnPoints() {
    var payment = new Payment({
        name: 'jackong2',
        age: 17
    })
    var doc = await payment.save();
}

module.exports = {
	sendPayment:sendPayment
	burnPoints:burnPoints
}    