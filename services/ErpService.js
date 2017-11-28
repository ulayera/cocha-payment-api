'use strict';
/* jshint strict: false, esversion: 6 */
var mongoose = require('mongoose');
const Payment = require('../models/mongo/schemas/payment');

function paymentAnalysis(_data){
	let paidRecords  = _.filter(_data.status,function(o){ return o.status === 'PAGADO';});
	let otherRecords = _.filter(_data.status,function(o){ return o.status !== 'PAGADO';});
	let total 		 = _.sumBy(paidRecords, function(o){ return parseFloat(o.amount); });
	let amountMatch  = (total === parseFloat(_data.total))? true : false;
	let consistencyCount = 0;
	_.forEach(paidRecords,function(value){
	  let existsMatch = _.find(otherRecords,function(o){
	  	return o.id === value.id && o.amount === value.amount && o.transaction_type == value.transaction_type && o.status === 'PENDIENTE';
	  })
	  if(existsMatch) {
	  	consistencyCount++;
	  }
	})
	return {
		isPaid: amountMatch,
		isConsistent: (consistencyCount == paidRecords.length && paidRecords.length > 0) ? true : false,
		records: ((amountMatch) ? paidRecords : otherRecords)
	};
}

async function assignTransaction(_cpnr,_businessNumber) {

    //safety checks
	let paymentData = await Payment.getByBusinessCpnr(_businessNumber,_cpnr);
	if(paymentData.business){
		throw {
			code:"BusinessAlreadyAssigned",
			msg:paymentData.business
		};
	}
	let payments = paymentAnalysis(paymentData);
	if(payments.isConsistent){
		if(payments.isPaid){
			paymentData.business = _businessNumber;
			var payment = new Payment.model(paymentData);
			await Payment.save(payment);
			return parsePaymentsRecords(payments.records);		
		} else {
			throw {
				code:"PaidAmountsDontMatch",
				records:payments.records
			};
		}
	} else {
		throw {
			code:"DbConsistencyError",
			records:payments.records
		};
	}
	//testing examples
	//return await Payment.getByBusinessCpnr("657-ASD-1","H01234201711");
	//return await Payment.get('5a1c747615fdc382f43e2f5f');
 	//await addStatus("5a1db7ec3fe87624a060cd0a","PAGADO","ITAU","CLP","234252354234","11000", {rut:"15309961-8"});
	//search for business number + cpnr combination
	/*
    var payment = new Payment.model({
        _id: new mongoose.Types.ObjectId,
        //_id: '5a1c7eea9a034b7618feab54',
	    cpnr: "H01234201711",
	    xpnr: "H01234",
	    email: "jmpaz@cocha.com",
	    status: [{id:"234252354234",transaction_type:"ITAU",currency:"CLP",status:"PENDIENTE",date:moment().toDate(),amount:11000,info:{rut:"15309961-8"}}],
	    business:"657-ASD-1",
	    total:13500,
	    ttl:10000
    });
    var doc = await Payment.save(payment);
	throw {};
	*/



}

async function addStatus(_sessionId,_status,_type,_currency,_paymentId, _amount, _info){
	let data = await Payment.get(_sessionId);
	data.status.push({
		id:_paymentId,transaction_type:_type,currency:_currency,status:_status,date:moment().toDate(),amount:_amount,info:_info
	});
    var payment = new Payment.model(data);
    return await Payment.save(payment);	
}

function parsePaymentsRecords(_records) {
	let parsed = [];
	_.forEach(_records,function(value){
		parsed.push({
			type: value.transaction_type,
			amount: value.amount,			
			currency: value.currency,
			info: value.info
		});
	});
	return parsed;
}

module.exports = {
	burnPoints:burnPoints,
	addStatus:addStatus
}   