'use strict';
/* jshint strict: false, esversion: 6 */

const paymentModel = require('../models/mongo/Payment');
const securityServices 	= require('cocha-external-services').securityServices;

let soapCall = require('soap');
let soapClients = {};

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

function parsePaymentData(_data){
	console.log(_data);
	if(!_data || !_data.length) {
		return undefined;
	}
	let response = {
		 payAmount:_data[0].monto
		,numCuotas:_data[0].num_cuotas
		,cardCode:_data[0].marcaTJ
		,cardNumber:decrypt(_data[0].numero_tarjeta)
		,expireDate:_data[0].expiracion
		,authCode:_data[0].codigo_autorizacion
		,trReferenc:_data[0].id_cocha
		,meReferenc:Koa.config.commerceCode		
	};
	console.log('marca');
	return response;
}

function decrypt(_data){
	var arrKey = securityServices.key.split(securityServices.separator);
	var valueArray =  _data.split(securityServices.separator);
	var decrypted = '';
	var j;
	for(var i=0;i<valueArray.length;i++){
		j = securityServices.array_search(valueArray[i],arrKey);
		decrypted += securityServices.chr(j);
	}
	return decrypted;
}

function parsePaymentsRecords(_records,_businessNumber,_useExtraData) {
	let parsed = [];
	_.forEach(_records,function(value){
		let data = {
			type: value.transaction_type,
			amount: value.amount,			
			currency: value.currency,
			info: {
				rut:value.info.rut,
				token:value.info.token,
				paymentId:value.info.payment_id
			}
		};
		if(_useExtraData){
			data.info.paymentData = parsePaymentData(value.info.paymentData);			
		}
		parsed.push(data);
	});

	if(_useExtraData){
		let response = {
			businessNumber:_businessNumber
			payments:parsed
		};
		return response;
	} else {
		return parsed;		
	}
}

async function soap(_params, _url, _action, _workflowData) {   
    _workflowData.function = 'canjeServiceWS:canjeServiceRequest';
	_workflowData.method = 'SOAP';
	_workflowData.serviceUrl = _url + ' -> ' + _action;
	_workflowData.params = _params;

	let response;
	try {
		response = await soapRequest(_params, _url, _action);
    	if (!response) {
			throw 'Respuesta vacia'
		}
		_workflowData.data = _.cloneDeep(response);
		_workflowData.success = true;
		Koa.log.infoSL(_workflowData);
	} catch (error) {
		_workflowData.data = error;
		_workflowData.success = false;
		Koa.log.errorSL(_workflowData);
		return {
			message: {
				msg: error,
				code: 'error'
			}
		};
	}
	return response;
}


async function soapRequest(_params, _wsdlUri, _method) {
	return await new Promise((resolve, reject) => {	
		soapCall.createClient(_wsdlUri, (err, soapClient) => {
			if (err) {
				reject(err);
			} else {
				soapClients[_wsdlUri] = soapClient;
				soapClient[_method](_params, (err, resp) => {
					console.log(err,resp);
					if(err){
						reject(err);
					} else {
						resolve(resp);
					}	
				});
			}
		});
	});
}

async function informPayment(_sessionId){
	let data = await paymentModel.get(_sessionId);
	let params = {
		 TOKEN:_sessionId
		,EMAIL:data.email
		,CPNR:data.cpnr
	};
	return await soap(params, Koa.config.path.erp.redeem, "canjeServiceWS", {});
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