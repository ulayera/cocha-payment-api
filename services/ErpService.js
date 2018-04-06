'use strict';
/* jshint strict: false, esversion: 6 */

const paymentModel = require('../models/mongo/Payment');
const soapServices = require('./SoapService');
const logService   = require('./LogService');
const itauService  = require('./ItauService');
const slackService = require('./SlackService');

function paymentAnalysis(_data){

	let paidRecords  = _.filter(_data.status,function(o){ return o.status === Koa.config.states.paid; });
	let otherRecords = _.filter(_data.status,function(o){ return o.status !== Koa.config.states.paid; });
	let total 		 = _.sumBy(paidRecords, function(o){ return parseFloat(o.amount); });
	let amountMatch  = (total === parseFloat(_data.total))? true : false;
	let consistencyCount = 0;
	_.forEach(paidRecords,function(value){
	  let existsMatch = _.find(otherRecords,function(o){
	  	return o.id === value.id && o.amount === value.amount && o.method == value.method && o.status === Koa.config.states.pending;
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

async function isBusinessAssigned(_sessionToken) {
	let paymentData = await paymentModel.get(_sessionToken);
	return (paymentData.business ? true : false);
}

async function assignTransaction(_sessionToken,_xpnr,_businessNumber) {
    //safety checks
	let paymentData = await paymentModel.getBySessionXpnr(_sessionToken,_xpnr);
	if(paymentData.business){
		throw {
			code:"BusinessAlreadyAssigned",
			business:paymentData.business
		};
	}
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
	
	if(data.state === Koa.config.states.closed) {
		data.processed = Koa.config.codes.processedFlag.closed;
	}

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


async function informPayment(_sessionId,_info,_amount,_type,_method,_workflowData){
	let data = await paymentModel.get(_sessionId);
	let params = {
		 TOKEN:_sessionId
		,EMAIL:Koa.config.productEmail.flighthotel
		,XPNR:data.xpnr
		,PAYMENTS:{
			PAYMENT:{
				 RUT:_info.rut
				,AMOUNT:_amount
				,PAYMENTID:_info.paymentId
				,TYPE:_type
				,METHOD:_method
				,STORECODE:""
				,AUTHORIZATIONCODE:""
			}
		}
	};

	let response;
	try {
		_workflowData.serviceContext = 'payment';
		_workflowData.logFunction = logService.logCallToService;
		response = await soapServices.callService(Koa.config.path.erp.redeem, 'canjeServiceWS', params, _workflowData);
	} catch (err) {
		response = err;
	}

	return response;
}


async function checkTransaction(_sessionToken,_xpnr){
	//safety checks
	// console.log(env);
	// if(env === 'development'){//maria paz needed dis
	// 	_sessionToken = "5a7a030ef0fc335e08b6addb";
	// 	_xpnr = "P013943";
	// }
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


async function checkPendingPayments(){
	let currentTimestamp = moment().unix();
    let failedPaymentTransactions = await paymentModel.getAllBy({ $and : [
        //{ $or : [{state:Koa.config.states.failed},{state:Koa.config.states.pending}] },
        { processed: 0 },
        { ttl : { $lt :currentTimestamp }}
    ]});
    //let failedErpTransactions = await paymentModel.getAllBy({ $and : [
	//  { state:Koa.config.states.paid },
    //  { processed: 0 },
    //  { ttl : { $lt :currentTimestamp }}
    //]});

	let results = [];
	_.forEach(failedPaymentTransactions,async function(transaction) {
		if(transaction.state !== Koa.config.states.pending && transaction.state !== Koa.config.states.failed){
			return;
		}

		console.log(transaction._id);	
		let data = await paymentModel.get(transaction._id);
		data.processed = Koa.config.codes.processedFlag.pending;
		await paymentModel.save(data);

		let transactionItau = _.find(transaction.status, function(o) { return o.method === Koa.config.codes.method.itau && (o.status === Koa.config.states.pending || o.status === Koa.config.states.pending); });
		if (transactionItau) {
			
			let rut  = (transactionItau.info.rut) ? transactionItau.info.rut.split('-')[0].replace(new RegExp('\\.', 'g'), '') : -1 ;
			let dv   = (transactionItau.info.rut) ? transactionItau.info.rut.split('-')[1] : -1;		
			if(rut!==-1 && dv!==-1) {

				let cancellationData = {
					params:{
						rut:rut,
						dv:dv,
						preExchangeId:transactionItau.id
					},
					authSession:{}
				};
				try {
					let result = await itauService.cancelPreExchange(cancellationData);
					data.processed = Koa.config.codes.processedFlag.closed;
					await paymentModel.save(data);
				} catch (err) {
					console.log("err",JSON.stringify(err));
					if(err && err.message && err.message.code && err.message.code.toString().indexOf('ActionError') !== -1){
						data.processed = Koa.config.codes.processedFlag.closed;
						await paymentModel.save(data);
					} else {
						slackService.log('info', JSON.stringify(err), 'Cron Itau');
						//leave them pending, someone(?) should take action from the slack alert
						//data.processed = Koa.config.codes.processedFlag.open;
						//await paymentModel.save(data);
					}
				}
			}
		}
	});
	return 'OK';
}

module.exports = {
	 assignTransaction:assignTransaction
	,addStatus:addStatus
	,informPayment:informPayment
	,checkTransaction:checkTransaction
	,checkPendingPayments:checkPendingPayments
	,isBusinessAssigned:isBusinessAssigned
}   