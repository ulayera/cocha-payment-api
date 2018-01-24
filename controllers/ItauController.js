'use strict';
/* jshint strict: false, esversion: 6 */

const sessionPaymentServices = require('../services/SessionPaymentService');
const itauServices = require('../services/ItauService');
const confirmationServices = require('../services/ConfirmationService');
const erpServices = require('../services/ErpService');
const userSessionModel = require('../models/redis/UserSession');
const paymentModel = require('../models/mongo/Payment');
const webpayServices = require('../services/WebpayService');
const slackService = require('../services/SlackService');

async function getPaymentSession(ctx) {
	let paymentSessionData = await sessionPaymentServices.get(ctx);

	ctx.body = {
		status: 'Complete',
		source: paymentSessionData.data.paymentSource,
		product: paymentSessionData.data.productName,
		price: paymentSessionData.data.price,
		origin: paymentSessionData.data.origin,
		destination: paymentSessionData.data.destination,
		departure: paymentSessionData.data.departure,
		returning: paymentSessionData.data.returning,
		numberRooms: paymentSessionData.data.rooms,
		adults: paymentSessionData.data.adults,
		children: paymentSessionData.data.children,
		infants: paymentSessionData.data.infants,
		pathOk: paymentSessionData.data.urlOk,
		pathError: paymentSessionData.data.urlError
	};
}

async function loadClient(ctx) {
	ctx.params.idDocument = ctx.params.rut + '' + ctx.params.dv
	if (await sessionPaymentServices.isValidNewAttempt(ctx)) {
		let userData = await itauServices.validateRut(ctx);

		userData.paymentSession = ctx.params.paymentSessionCode;

		ctx.params.phoneNumber = userData.phoneNumber;
		ctx.params.email = userData.email;
		let dynamicKeyData = await itauServices.generateDynamicKey(ctx);

		userData.dynamicKey = dynamicKeyData;
		userSessionModel.createUserSession(ctx.authSession.paymentIntentionId, userData, 'sessionClose');

		ctx.body = {
			status: 'Complete',
			name: userData.name + ' ' + userData.firstLastName + ' ' + userData.secondLastName,
			phone: userData.phoneNumber,
			expireDate: dynamicKeyData.expiration
		};
	}
}

async function sendDynamicKey(ctx) {
	let userData = ctx.authSession.userSessionData;
	if (userData.dynamicKey.attempts > 2) {
		throw {
			status: 401,
			message: {
				code: 'SendKeyAttemptsError',
				msg: 'You have exceeded the number of attempts for send dynamic key'
			}
		};
	}

	ctx.params.rut = userData.rut;
	ctx.params.dv = userData.dv;
	ctx.params.phoneNumber = userData.phoneNumber;
	ctx.params.email = userData.email;
	let dynamicKeyData = await itauServices.generateDynamicKey(ctx);
	userData.dynamicKey = dynamicKeyData;
	// dynamicKeyData.attempts = userData.dynamicKey.attempts + 1 //Testing

	await userSessionModel.updateUserSession(ctx.authSession.paymentIntentionId, userData);

	ctx.body = {
		status: 'Complete',
		phone: userData.phoneNumber,
		keyExpireDate: dynamicKeyData.expiration
	};
}

async function validateDynamicKey(ctx) {
	let userData = ctx.authSession.userSessionData;
	ctx.params.rut = userData.rut;
	ctx.params.dv = userData.dv;
	ctx.params.dynamicKeyId = userData.dynamicKey.id;

	let checkDynamicKeyData = await itauServices.checkDynamicKey(ctx);
	userData.dynamicKey.checkStatus = checkDynamicKeyData.status;
	userData.expiration = checkDynamicKeyData.sessionExpiration;

	let sessionFlowData = await itauServices.validateSessionFlow(ctx);
	userData.totalPoints = sessionFlowData.availablePoints;
	userData.availablePoints = sessionFlowData.availablePoints;
	userData.totalAmount = sessionFlowData.availableAmount;
	userData.availableAmount = sessionFlowData.availableAmount;

	ctx.params.paymentSessionCode = userData.paymentSession;
	let paymentSessionData = await sessionPaymentServices.get(ctx);
	userData.cochaCode = paymentSessionData.data.cochaCode;
	userData.cpnr = paymentSessionData.data.cpnr;
	userData.productName = paymentSessionData.data.productName;
	userData.price = paymentSessionData.data.price;
	userData.productSrc = paymentSessionData.data.paymentSource;

	ctx.params.idDocument = userData.rut + '' + userData.dv;
	await sessionPaymentServices.addAttempt(ctx);
	await userSessionModel.updateUserSession(ctx.authSession.paymentIntentionId, userData, 'sessionOpen');

	ctx.body = {
		status: 'Complete',
		points: userData.totalPoints,
		amount: userData.totalAmount
	};
}

async function executePayment(ctx) {
	let userData = ctx.authSession.userSessionData;
	ctx.params.paymentSessionCode = userData.paymentSession;
	if (await sessionPaymentServices.isValidAttempt(ctx) && ctx.authType === 'sessionOpen') {
		if (userData.preExchange) {
			throw {
				status: 400,
				message: {
					code: 'InProcessError',
					msg: "Payment in process, it is not possible to make a new payment"
				}
			};
		}
		if (!_.isNumber(ctx.params.spendingAmount)) {
			throw {
				status: 400,
				message: {
					code: 'ParamsError',
					msg: "Parameter 'spendingAmount' is invalid: " + ctx.params.spendingAmount
				}
			};
		}
		ctx.params.spendingAmount = (ctx.params.spendingAmount > userData.price) ? userData.price : ctx.params.spendingAmount;

		ctx.params.rut = userData.rut;
		ctx.params.dv = userData.dv;
		ctx.params.productId = userData.cpnr;
		ctx.params.dynamicKeyId = userData.dynamicKey.id;
		let preExchangeData = await itauServices.requestPreExchange(ctx);
		userData.availableAmount = preExchangeData.availableAmount;
		userData.spentAmount = preExchangeData.spentAmount;
		delete preExchangeData.availableAmount;
		delete preExchangeData.spentAmount;
		userData.preExchange = preExchangeData;

		await erpServices.addStatus(userData.paymentSession, Koa.config.states.pending, Koa.config.codes.type.points, Koa.config.codes.method.itau, Koa.config.codes.currency.clp , userData.preExchange.id, userData.spentAmount, {
			rut: userData.rut + '-' + userData.dv
		});

		let responseErpStatus = null;		

		if (userData.spentAmount === userData.price) {
			try {
				userData.extraExchange = null;

				await itauServices.validateClient(ctx);

				ctx.params.preExchangeId = userData.preExchange.id;
				ctx.params.extraExchangeAmount = 0;
				ctx.params.productName = userData.productName;
				ctx.params.productId = userData.cpnr;
				let exchangeData = await itauServices.requestExchange(ctx);
				userData.postExchange = exchangeData;

				let info = {
					rut: userData.rut + '-' + userData.dv,
					paymentId: exchangeData.id
				};

				await erpServices.addStatus(ctx.params.paymentSessionCode, Koa.config.states.paid, Koa.config.codes.type.points, Koa.config.codes.method.itau, Koa.config.codes.currency.clp, userData.preExchange.id, userData.spentAmount, info);

				let erpResponse = await erpServices.informPayment(ctx.params.paymentSessionCode, info, userData.spentAmount, Koa.config.codes.type.points, Koa.config.codes.method.itau, ctx.authSession);

				if(erpResponse && erpResponse.STATUS && erpResponse.STATUS === 'OK') {
					await erpServices.addStatus(ctx.params.paymentSessionCode, Koa.config.states.closed, Koa.config.codes.type.points, Koa.config.codes.method.itau, Koa.config.codes.currency.clp, userData.preExchange.id, userData.spentAmount, info);
				} else {
					slackService.log('info', JSON.stringify(erpResponse),'Smart Error');					
					await erpServices.addStatus(ctx.params.paymentSessionCode, Koa.config.states.erpFail, Koa.config.codes.type.points, Koa.config.codes.method.itau, Koa.config.codes.currency.clp, userData.preExchange.id, userData.spentAmount, info);
				}
				
				if(erpResponse && erpResponse.DATA && erpResponse.DATA.BUSINESSNUMBER){
					let payment = await paymentModel.get(ctx.params.paymentSessionCode);
					payment.business = erpResponse.DATA.BUSINESSNUMBER;
					await paymentModel.save(payment);
				}

			} catch (err) {
				Koa.log.error(err);
				ctx.params.preExchangeId = userData.preExchange.id;
				let canceledPreExchangeData = await itauServices.cancelPreExchange(ctx);
				await erpServices.addStatus(userData.paymentSession, Koa.config.states.failed, Koa.config.codes.type.points, Koa.config.codes.method.itau, Koa.config.codes.currency.clp, userData.preExchange.id, userData.spentAmount, {
					rut: ctx.params.rut + '-' + ctx.params.dv
				});
				
				throw err;
			}

			confirmationServices.reportPay(ctx);
			await sessionPaymentServices.remove(ctx);
		} else {
			try {
				let params = {
					commerceCode: Koa.config.commerceCodes.cocha, //Puede ser mas de uno en el futuro
					amount: userData.price - userData.spentAmount,
					cochaCode: userData.cochaCode,
					holderName: userData.name,
					holderEmail: userData.email
				};
				let paymentData = await webpayServices.getPaymentData(params, ctx.authSession);
				paymentData.commerceCode = params.commerceCode;
				userData.coPayment = params.amount;
				userData.extraExchange = paymentData;
				userData.extraExchange.paymentTry = 1;

				await erpServices.addStatus(userData.paymentSession, Koa.config.states.pending, Koa.config.codes.type.online, Koa.config.codes.method.webpay, Koa.config.codes.currency.clp, userData.extraExchange.tokenWebPay, userData.coPayment, {});
			} catch (err) {
				Koa.log.error(err);
				ctx.params.preExchangeId = userData.preExchange.id;
				let canceledPreExchangeData = await itauServices.cancelPreExchange(ctx);
				await erpServices.addStatus(userData.paymentSession, Koa.config.states.failed, Koa.config.codes.type.points, Koa.config.codes.method.itau, Koa.config.codes.currency.clp, userData.preExchange.id, userData.spentAmount, {
					rut: ctx.params.rut + '-' + ctx.params.dv
				});
				throw err;
			}
		}
		await userSessionModel.updateUserSession(ctx.authSession.paymentIntentionId, userData);

		ctx.body = {
			status: ((userData.extraExchange) ? 'Pending' : ( responseErpStatus ? responseErpStatus : 'Complete')),
			points: userData.availablePoints,
			amount: userData.availableAmount,
			url: (userData.extraExchange) ? userData.extraExchange.url : null
		};
	} else {
		throw {
			status: 401,
			message: {
				code: 'AuthError',
				msg: 'Access denied'
			}
		};
	}
}

async function checkPayment(ctx) {
	let userData = ctx.authSession.userSessionData;
	ctx.params.paymentSessionCode = userData.paymentSession;
	if (await sessionPaymentServices.isValidAttempt(ctx) && ctx.authType === 'sessionOpen') {
		if (!userData.extraExchange) {
			throw {
				status: 400,
				message: {
					code: 'closeProcessError',
					msg: "Payment is not in process, it is not possible to check the payment"
				}
			};
		}
		ctx.params.rut = userData.rut;
		ctx.params.dv = userData.dv;
		let paymentData;
		let paymentStatusData;
		try {
			paymentStatusData = await webpayServices.checkPayment(userData.extraExchange.tokenWebPay, ctx.authSession);
			if (paymentStatusData.status === 'Pending') {
				if (userData.extraExchange.paymentTry > 2) {
					throw {
						status: 500,
						message: {
							code: 'PaymentAttemptsError',
							msg: 'You have exceeded the number of payment attempts'
						}
					};
				} else {
					let params = {
						commerceCode: Koa.config.commerceCodes.cocha, //Puede ser mas de uno en el futuro
						amount: userData.coPayment,
						cochaCode: userData.cochaCode,
						holderName: userData.name,
						holderEmail: userData.email
					};
					paymentData = await webpayServices.getPaymentData(params, ctx.authSession);
					paymentData.commerceCode = params.commerceCode;
				}
			}
		} catch (err) {
			ctx.params.preExchangeId = userData.preExchange.id;
			let canceledPreExchangeData = await itauServices.cancelPreExchange(ctx);
			await erpServices.addStatus(userData.paymentSession, Koa.config.states.failed, Koa.config.codes.type.points, Koa.config.codes.method.itau, Koa.config.codes.currency.clp, userData.preExchange.id, userData.spentAmount, {
				rut: userData.rut + '-' + userData.dv
			});

			await erpServices.addStatus(userData.paymentSession, Koa.config.states.failed, Koa.config.codes.type.online, Koa.config.codes.method.webpay, Koa.config.codes.currency.clp, userData.extraExchange.tokenWebPay, userData.coPayment, {});
			await sessionPaymentServices.remove(ctx, false);
			throw err;
		} 
		
		if (paymentStatusData.status === 'Pending') {	
			await erpServices.addStatus(userData.paymentSession, Koa.config.states.failed, Koa.config.codes.type.online, Koa.config.codes.method.webpay, Koa.config.codes.currency.clp, userData.extraExchange.tokenWebPay, userData.coPayment, {});
			userData.extraExchange.commerceCode = paymentData.commerceCode;			
			userData.extraExchange.tokenWebPay = paymentData.tokenWebPay;
			userData.extraExchange.url = paymentData.url;
			userData.extraExchange.paymentTry++;
			await erpServices.addStatus(userData.paymentSession, Koa.config.states.pending, Koa.config.codes.type.online, Koa.config.codes.method.webpay, Koa.config.codes.currency.clp, userData.extraExchange.tokenWebPay, userData.coPayment, {});

			await userSessionModel.updateUserSession(ctx.authSession.paymentIntentionId, userData);

			ctx.body = {
				status: 'Pending',
				points: userData.availablePoints,
				amount: userData.availableAmount,
				url: userData.extraExchange.url,
				okPath: null,
				errPath: null
			};
		} else {
			paymentStatusData.commerceCode = userData.extraExchange.commerceCode;

			await erpServices.addStatus(userData.paymentSession, Koa.config.states.paid, Koa.config.codes.type.online, Koa.config.codes.method.webpay, Koa.config.codes.currency.clp, userData.extraExchange.tokenWebPay, userData.coPayment,{
				paymentData:paymentStatusData
			});

			let paymentSessionData = await sessionPaymentServices.get(ctx);
			try {
				ctx.params.dynamicKeyId = userData.dynamicKey.id;
				await itauServices.validateClient(ctx);

				ctx.params.preExchangeId = userData.preExchange.id;
				ctx.params.spendingAmount = userData.spentAmount;
				ctx.params.extraExchangeAmount = userData.coPayment;
				ctx.params.productName = userData.productName;
				ctx.params.productId = userData.cpnr;
				let exchangeData = await itauServices.requestExchange(ctx);
				userData.postExchange = exchangeData;	

				let info = {
					rut: userData.rut + '-' + userData.dv,
					paymentId: exchangeData.id
				};

				await erpServices.addStatus(userData.paymentSession, Koa.config.states.paid, Koa.config.codes.type.points, Koa.config.codes.method.itau, Koa.config.codes.currency.clp, userData.preExchange.id, userData.spentAmount, info);
	
				await userSessionModel.updateUserSession(ctx.authSession.paymentIntentionId, userData);
	
				let erpResponse = await erpServices.informPayment(ctx.params.paymentSessionCode, info, userData.spentAmount, Koa.config.codes.type.points, Koa.config.codes.method.itau, ctx.authSession);

				if(erpResponse && erpResponse.STATUS && erpResponse.STATUS === 'OK') {
					await erpServices.addStatus(userData.paymentSession, Koa.config.states.closed, Koa.config.codes.type.points, Koa.config.codes.method.itau, Koa.config.codes.currency.clp, userData.preExchange.id, userData.spentAmount, info);
				} else {
					await erpServices.addStatus(userData.paymentSession, Koa.config.states.erpFail, Koa.config.codes.type.points, Koa.config.codes.method.itau, Koa.config.codes.currency.clp, userData.preExchange.id, userData.spentAmount, info);
					slackService.log('info', JSON.stringify(erpResponse),'Smart Error');
				}

				if(erpResponse && erpResponse.DATA && erpResponse.DATA.BUSINESSNUMBER){
					let payment = await paymentModel.get(userData.paymentSession);
					payment.business = erpResponse.DATA.BUSINESSNUMBER;
					await paymentModel.save(payment);
				}

				confirmationServices.reportPay(ctx);
				
				ctx.body = {
					status: 'Complete',
					points: userData.availablePoints,
					amount: userData.availableAmount,
					url: null,
					okPath: paymentSessionData.data.urlOk,
					errPath: paymentSessionData.data.urlError
				};
			} catch (err) {
				Koa.log.error(err);
				// Alguna forma de que quede pendiente validar el cobro de los puntos en un cron
				ctx.body = {
					status: 'PointsPending',
					points: userData.availablePoints,
					amount: userData.availableAmount,
					url: null,
					okPath: paymentSessionData.data.urlOk,
					errPath: paymentSessionData.data.urlError
				};
			} finally {
				await sessionPaymentServices.remove(ctx);
			}
		}
	} else {
		throw {
			status: 401,
			message: {
				code: 'AuthError',
				msg: 'Access denied'
			}
		};
	}
}

async function cancelPayment(ctx) {
	let userData = ctx.authSession.userSessionData;
	ctx.params.paymentSessionCode = userData.paymentSession;
	let paymentSessionData = await sessionPaymentServices.get(ctx);
	if (await sessionPaymentServices.isValidAttempt(ctx) && ctx.authType === 'sessionOpen') {
		if (userData.preExchange && !userData.postExchange && userData.extraExchange) {
			ctx.params.rut = userData.rut;
			ctx.params.dv = userData.dv;
			ctx.params.preExchangeId = userData.preExchange.id;
			let canceledPreExchangeData = await itauServices.cancelPreExchange(ctx);
			await erpServices.addStatus(userData.paymentSession, Koa.config.states.failed, Koa.config.codes.type.points, Koa.config.codes.method.itau, Koa.config.codes.currency.clp, userData.preExchange.id, userData.spentAmount, {
				rut: userData.rut + '-' + userData.dv
			});
			await erpServices.addStatus(userData.paymentSession, Koa.config.states.failed, Koa.config.codes.type.online, Koa.config.codes.method.webpay, Koa.config.codes.currency.clp, userData.extraExchange.tokenWebPay, userData.coPayment, {});			
		}
		ctx.body = {
			status: 'Complete',
			okPath: paymentSessionData.data.urlOk,
			errPath: paymentSessionData.data.urlError
		};
	} else {
		ctx.body = {
			status: 'Invalid',
			okPath: paymentSessionData.data.urlOk,
			errPath: paymentSessionData.data.urlError
		};
	}
}

module.exports = {
	getPaymentSession: getPaymentSession,
	loadClient: loadClient,
	sendDynamicKey: sendDynamicKey,
	validateDynamicKey: validateDynamicKey,
	executePayment: executePayment,
	checkPayment: checkPayment,
	cancelPayment: cancelPayment,
	test:test
};

async function test(ctx){
	//ctx.body = await soapServices.getDetails(Koa.config.path.erp.redeem, 'canjeServiceWS');
	//await slackService.log('info', JSON.stringify({lllaaalalalala:"tomtotmot"}));
	ctx.body = await erpServices.checkPendingPayments();
}