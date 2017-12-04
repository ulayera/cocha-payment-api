'use strict';
/* jshint strict: false, esversion: 6 */

const paymentModel = require('../models/mongo/Payment');

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
			payment.state = "CERRADO";
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
	assignTransaction:assignTransaction,
	addStatus:addStatus
}   