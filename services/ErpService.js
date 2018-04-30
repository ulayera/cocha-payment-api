'use strict';
/* jshint strict: false, esversion: 6 */

const soapServices = require('./SoapService');
const logService   = require('./LogService');

async function informPayment(_sessionId,_info,_amount,_type,_method,_workflowData,_xpnr){
	let params = {
		 TOKEN:_sessionId
		,EMAIL:Koa.config.productEmail.flighthotel
		,XPNR:_xpnr
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
    console.log("ErpService.informPayment() -> " + params);
		response = await soapServices.callService(Koa.config.path.erp.redeem, 'canjeServiceWS', params, _workflowData);
	} catch (err) {
		response = err;
	}

	return response;
}

async function checkPendingPayments(){
	/*let currentTimestamp = moment().unix();
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
	});*/
	return 'OK';
}

module.exports = {
	informPayment:informPayment,
	checkPendingPayments:checkPendingPayments
}