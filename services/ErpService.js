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

async function assignTransaction(_sessionToken,_cpnr,_businessNumber) {
    //safety checks
	let paymentData = await paymentModel.getBySessionCpnr(_sessionToken,_cpnr);
	if(paymentData.business){
		throw {
			code:"BusinessAlreadyAssigned",
			business:paymentData.business
		};
	}
	let payments = paymentAnalysis(paymentData);
	if(payments.isConsistent){
		if(payments.isPaid){
			//paymentData.business = _businessNumber;
			var payment = new paymentModel.model(paymentData);
			await paymentModel.save(payment);
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
}

async function addStatus(_sessionId,_status,_type,_currency,_paymentId, _amount, _info, _generalStatus){
	let data = await paymentModel.get(_sessionId);
	if(_generalStatus) {
		data.state = _generalStatus;
	} else {
		data.state = _status;
	}
	data.status.push({
		id:_paymentId,transaction_type:_type,currency:_currency,status:_status,date:moment().toDate(),amount:_amount,info:_info
	});
    var payment = new paymentModel.model(data);
    return await paymentModel.save(payment);	
}


function parsePaymentsRecords(_records,_businessNumber) {
	let parsed = [];
	_.forEach(_records,function(value){
		let data = {
			 type: value.transaction_type
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
		,CPNR:data.cpnr
	};

	let response;
	try {
		response = await soapServices.callService(Koa.config.path.erp.redeem, 'canjeServiceWS', params);
	} catch(err) {
		response = err;
	}
	
	return response;
}

async function checkTransaction(_sessionToken,_cpnr){
    //safety checks
	let paymentData = await paymentModel.getBySessionCpnr(_sessionToken,_cpnr);
	if(!paymentData.business){
		throw {
			code:"BusinessNotAssigned"
		};
	}
	
	let payments = paymentAnalysis(paymentData);
	if(payments.isConsistent){
		if(payments.isPaid){
			return parsePaymentsRecords(payments.records,paymentData.business,'extraPaymentData');		
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

module.exports = {
	 assignTransaction:assignTransaction
	,addStatus:addStatus
	,informPayment:informPayment
	,checkTransaction:checkTransaction
}   