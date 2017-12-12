'use strict';
/* jshint strict: false, esversion: 6 */

const paymentModel = require('../models/mongo/Payment');
const soapServices = require('./SoapService');

function paymentAnalysis(_data){
	let paidRecords  = _.filter(_data.status,function(o){ return o.status === 'PAGADO';});
	let otherRecords = _.filter(_data.status,function(o){ return o.status !== 'PAGADO';});
	let total 		 = _.sumBy(paidRecords, function(o){ return parseFloat(o.amount); });
	let amountMatch  = (total === parseFloat(_data.total))? true : false;
	let consistencyCount = 0;
	_.forEach(paidRecords,function(value){
	  let existsMatch = _.find(otherRecords,function(o){
	  	return o.id === value.id && o.amount === value.amount && o.method == value.method && o.status === 'PENDIENTE';
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

async function assignTransaction(_sessionToken,_xpnr,_businessNumber) {
    //safety checks
	let paymentData = await paymentModel.getBySessionXpnr(_sessionToken,_xpnr);
	/*
	if(paymentData.business){
		throw {
			code:"BusinessAlreadyAssigned",
			business:paymentData.business
		};
	}*/
	let payments = paymentAnalysis(paymentData);
	if(payments.isConsistent){
		if(payments.isPaid){
			paymentData.business = _businessNumber;
			var payment = new paymentModel.model(paymentData);
			await paymentModel.save(payment);
			return parsePaymentsRecords(payments.records,paymentData.business);		
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
}

async function addStatus(_sessionId,_status,_type,_method,_currency,_paymentId, _amount, _info, _generalStatus){
	let data = await paymentModel.get(_sessionId);
	if(_generalStatus) {
		data.state = _generalStatus;
	} else {
		data.state = _status;
	}
	data.status.push({
		 id:_paymentId
		,transaction_type:_type
		,method:_method
		,currency:_currency
		,status:_status
		,date:moment().toDate()
		,amount:_amount
		,info:_info
	});
    var payment = new paymentModel.model(data);
    return await paymentModel.save(payment);	
}


function parsePaymentsRecords(_records,_businessNumber) {
	let parsed = [];
	_.forEach(_records,function(value){
		let data = {
			 type: value.transaction_type
			,method: value.method
			,amount: value.amount
			,currency: value.currency
			,info: value.info
		};
		parsed.push(data);
	});

	return {
		 businessNumber:_businessNumber
		,payments:parsed
	};
}

async function informPayment(_sessionId){
	let data = await paymentModel.get(_sessionId);
	let params = {
		 TOKEN:_sessionId
		,EMAIL:data.email
		,CPNR:data.xpnr
	};

	let response;
	try {
		response = await soapServices.callService(Koa.config.path.erp.redeem, 'canjeServiceWS', params);
	} catch(err) {
		response = err;
	}
	
	return response;
}

async function checkTransaction(_sessionToken,_xpnr){
    //safety checks
	let paymentData = await paymentModel.getBySessionXpnr(_sessionToken,_xpnr);
	if(!paymentData.business){
		throw {
			code:"BusinessNotAssigned"
		};
	}
	
	let payments = paymentAnalysis(paymentData);
	if(payments.isConsistent){
		if(payments.isPaid){
			return parsePaymentsRecords(payments.records,paymentData.business);		
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
}


async function getPaymentData(_sessionToken,_xpnr){
	let paymentData = await paymentModel.getBySessionXpnr(_sessionToken,_xpnr);
	let payments = paymentAnalysis(paymentData);
	if(payments.isConsistent){
		if(payments.isPaid){
			return parsePaymentsRecords(payments.records,paymentData.business);		
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
}

async function checkPendingPayments(){
	let currentTimestamp = moment().unix();
    let failedPaymentTransactions = await paymentModel.getAllBy({ $and : [
        { $or : [{state:Koa.config.states.failed},{state:Koa.config.states.pending}] },
        { processed: 0 },
        { ttl : { $lt :currentTimestamp }}
    ]});
    //unblock points
    let failedErpTransactions = await paymentModel.getAllBy({ $and : [
        { state:Koa.config.states.paid },
        { processed: 0 },
        { ttl : { $lt :currentTimestamp }}
    ]});
	//retry smart
	//send a warning if smart failed
	//put a processed = 1 mark in the document
	console.log("failedpayment",failedPaymentTransactions.length);
	console.log("failederp",failedErpTransactions.length);	
	throw {};

	return failedTransactions;
}

module.exports = {
	 assignTransaction:assignTransaction
	,addStatus:addStatus
	,informPayment:informPayment
	,checkTransaction:checkTransaction
	,checkPendingPayments:checkPendingPayments
	,getPaymentData:getPaymentData
}   