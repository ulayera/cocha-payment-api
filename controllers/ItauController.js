'use strict';
/* jshint strict: false, esversion: 6 */

const sessionPaymentServices = require('../services/SessionPaymentService');
const itauServices = require('../services/ItauService');
const erpServices = require('../services/ErpService');
const userSessionModel = require('../models/redis/UserSession');

const webpayServices = require('../services/WebpayService');

async function getPaymentSession(ctx) {
	let paymentSessionData = await sessionPaymentServices.get(ctx);

	ctx.body = {
		status: 'Complete',
		product: paymentSessionData.data.productName,
		price: paymentSessionData.data.price,
		origin: paymentSessionData.data.origin,
		destination: paymentSessionData.data.destination,
		departure: paymentSessionData.data.departure,
		returning: paymentSessionData.data.returning,
		numberRooms: paymentSessionData.data.rooms,
		adults: paymentSessionData.data.adults,
		children: paymentSessionData.data.children,
		infants: paymentSessionData.data.infants
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
			name: userData.name,
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
				code: 'AttemptsError',
				msg: 'Estimado Cliente, ha excedido el número de intentos'
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
	try {
		let checkDynamicKeyData = await itauServices.checkDynamicKey(ctx);
		userData.dynamicKey.checkingStatus = checkDynamicKeyData.checkingStatus
	} catch (err) {
		if ((err.code === 'ActionError-150' || err.code === 'ActionError-151') && userData.dynamicKey.attempts > 2) {
			Koa.log.error(err);
			throw {
				status: 400,
				message: {
					code: 'AttemptsError',
					msg: 'Estimado Cliente, ha excedido el número de intentos'
				}
			};
		} else {
			throw err;
		}
	}

	let startSessionData = await itauServices.startSession(ctx)
	userData.expiration = startSessionData.expiration;

	let sessionFlowData = await itauServices.validateSessionFlow(ctx);
	userData.totalPoints = sessionFlowData.availablePoints;
	userData.availablePoints = sessionFlowData.availablePoints;

	ctx.params.paymentSessionCode = userData.paymentSession;
	let paymentSessionData = await sessionPaymentServices.get(ctx);
	userData.cochaCode = paymentSessionData.data.cochaCode;
	userData.cpnr = paymentSessionData.data.cpnr;
	userData.productName = paymentSessionData.data.productName;
	userData.price = paymentSessionData.data.price;

	ctx.params.idDocument = userData.rut + '' + userData.dv;
	await sessionPaymentServices.addAttempt(ctx);
	await userSessionModel.updateUserSession(ctx.authSession.paymentIntentionId, userData, 'sessionOpen');

	ctx.body = {
		status: 'Complete',
		points: userData.totalPoints
	};
}

async function executePayment(ctx) {
	let userData = ctx.authSession.userSessionData;
	ctx.params.paymentSessionCode = userData.paymentSession;
	if (await sessionPaymentServices.isValidAttempt(ctx) && ctx.authType === 'sessionOpen') {
		if (!_.isNumber(ctx.params.spendingPoint)) {
			throw {
				status: 400,
				message: {
					code: 'ParamsError',
					msg: "Parameter 'spendingPoint' is invalid: " + ctx.params.spendingPoint
				}
			};
		}
		ctx.params.spendingPoint = (ctx.params.spendingPoint > userData.price) ? userData.price : ctx.params.spendingPoint;

		ctx.params.rut = userData.rut;
		ctx.params.dv = userData.dv;
		ctx.params.dynamicKeyId = userData.dynamicKey.id;
		let preExchangeData = await itauServices.requestPreExchange(ctx);
		userData.availablePoints = preExchangeData.availablePoints;
		userData.spentPoints = preExchangeData.spentPoints;
		delete preExchangeData.availablePoints;
		delete preExchangeData.spentPoints;
		userData.preExchange = preExchangeData;

		await erpServices.addStatus(userData.paymentSession, Koa.config.states.pending, Koa.config.codes.payment.itau, Koa.config.codes.currency.clp , userData.preExchange.id, userData.spentPoints, {
			rut:userData.rut + '-' + userData.dv
		});
		
		if (userData.spentPoints === userData.price) {
			try {
				userData.extraExchange = null;

				await itauServices.validateClient(ctx);

				ctx.params.preExchangeId = userData.preExchange.id;
				ctx.params.extraExchangeAmount = 0;
				ctx.params.productName = userData.productName;
				ctx.params.cpnr = userData.cpnr;
				let exchangeData = await itauServices.requestExchange(ctx);

				await erpServices.addStatus(ctx.params.paymentSessionCode, Koa.config.states.paid , Koa.config.codes.payment.itau, Koa.config.codes.currency.clp, preExchangeData.id,preExchangeData.spentPoints, {
						 rut: ctx.params.rut + '-' + ctx.params.dv
						,paymentId: exchangeData.id
					});

				userData.postExchange = exchangeData;

				let erpResponse = erpServices.informPayment(ctx.params.paymentSessionCode);

				if(erpResponse && erpResponse.STATUS && erpResponse.STATUS === 'OK'){
					await erpServices.addStatus(ctx.params.paymentSessionCode, Koa.config.states.closed, Koa.config.codes.payment.itau, Koa.config.codes.currency.clp, preExchangeData.id,preExchangeData.spentPoints, {
						 rut: ctx.params.rut + '-' + ctx.params.dv
						,paymentId:exchangeData.id
					});
				}

			} catch (err) {
				Koa.log.error(err);
				ctx.params.preExchangeId = userData.preExchange.id;
				let canceledPreExchangeData = await itauServices.cancelPreExchange(ctx);
				await erpServices.addStatus(userData.paymentSession, Koa.config.states.failed, Koa.config.codes.payment.itau, Koa.config.codes.currency.clp, userData.preExchange.id, userData.spentPoints, {
					rut: ctx.params.rut + '-' + ctx.params.dv
				});
				
				throw err;
			}
			//Es posible preguntar a ITAU si se cobraron los puntos?
			await sessionPaymentServices.remove(ctx);
		} else {
			try {
				let params = {
					amount: userData.price - userData.spentPoints,
					cochaCode: userData.cochaCode,
					holderName: userData.name,
					holderEmail: userData.email
				};
				let paymentData = await webpayServices.getPaymentData(params);
				userData.coPayment = params.amount;
				userData.extraExchange = paymentData;
				userData.extraExchange.paymentTry = 1;

				await erpServices.addStatus(userData.paymentSession, Koa.config.states.pending, Koa.config.codes.payment.webpay, Koa.config.codes.currency.clp, userData.extraExchange.tokenWebPay, userData.coPayment, {});
			} catch (err) {
				Koa.log.error(err);
				ctx.params.preExchangeId = userData.preExchange.id;
				let canceledPreExchangeData = await itauServices.cancelPreExchange(ctx);
				await erpServices.addStatus(userData.paymentSession, Koa.config.states.failed, Koa.config.codes.payment.itau, Koa.config.codes.currency.clp, userData.preExchange.id, userData.spentPoints, {
					rut: ctx.params.rut + '-' + ctx.params.dv
				});
				throw err;
			}
		}
		await userSessionModel.updateUserSession(ctx.authSession.paymentIntentionId, userData);

		ctx.body = {
			status: (userData.extraExchange) ? 'Pending' : 'Complete',
			points: userData.availablePoints,
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
		ctx.params.rut = userData.rut;
		ctx.params.dv = userData.dv;
		let paymentData;
		let paymentStatusData;
		try {
			paymentStatusData = await webpayServices.checkPayment(userData.extraExchange.tokenWebPay);
			if (paymentStatusData.status === 'Pending') {
				if (userData.extraExchange.paymentTry > 2) {
					throw {
						status: 500,
						message: {
							code: 'PaymentAttemptsError',
							msg: 'Estimado Cliente, ha excedido el número de intentos de pago'
						}
					};
				} else {
					let params = {
						amount: userData.coPayment,
						cochaCode: userData.cochaCode,
						holderName: userData.name,
						holderEmail: userData.email
					};
					paymentData = await webpayServices.getPaymentData(params);
				}
			}
		} catch (err) {
			ctx.params.preExchangeId = userData.preExchange.id;
			let canceledPreExchangeData = await itauServices.cancelPreExchange(ctx);
			await erpServices.addStatus(userData.paymentSession, Koa.config.states.failed, Koa.config.codes.payment.itau, Koa.config.codes.currency.clp, userData.preExchange.id, userData.spentPoints, {
				rut: userData.rut + '-' + userData.dv
			});

			await erpServices.addStatus(userData.paymentSession, Koa.config.states.failed, Koa.config.codes.payment.webpay, Koa.config.codes.currency.clp, userData.extraExchange.tokenWebPay, userData.coPayment, {});
			await sessionPaymentServices.remove(ctx);
			throw err;
		} 
		
		if (paymentStatusData.status === 'Pending') {	
			await erpServices.addStatus(userData.paymentSession, Koa.config.states.failed, Koa.config.codes.payment.webpay, Koa.config.codes.currency.clp, userData.extraExchange.tokenWebPay, userData.coPayment, {});
			userData.extraExchange.tokenWebPay = paymentData.tokenWebPay;
			userData.extraExchange.url = paymentData.url;
			userData.extraExchange.paymentTry++;
			await erpServices.addStatus(userData.paymentSession, Koa.config.states.pending, Koa.config.codes.payment.webpay, Koa.config.codes.currency.clp, userData.extraExchange.tokenWebPay, userData.coPayment, {});

			await userSessionModel.updateUserSession(ctx.authSession.paymentIntentionId, userData);

			ctx.body = {
				status: 'Pending',
				url: userData.extraExchange.url
			};
		} else {
			await erpServices.addStatus(userData.paymentSession, Koa.config.states.paid, Koa.config.codes.payment.webpay, Koa.config.codes.currency.clp, userData.extraExchange.tokenWebPay, userData.coPayment,{
				paymentData:paymentStatusData
			});

			try {
				ctx.params.dynamicKeyId = userData.dynamicKey.id;
				await itauServices.validateClient(ctx);

				ctx.params.preExchangeId = userData.preExchange.id;
				ctx.params.spendingPoint = userData.spentPoints;
				ctx.params.extraExchangeAmount = userData.coPayment;
				ctx.params.productName = userData.productName;
				ctx.params.cpnr = userData.cpnr;
				let exchangeData = await itauServices.requestExchange(ctx);
				userData.postExchange = exchangeData;	

				await erpServices.addStatus(userData.paymentSession, Koa.config.states.paid, Koa.config.codes.payment.itau, Koa.config.codes.currency.clp, userData.preExchange.id, userData.spentPoints, {
					 rut: userData.rut + '-' + userData.dv
					,paymentId:exchangeData.id
				});
				await sessionPaymentServices.remove(ctx);
	
				let erpResponse = erpServices.informPayment(ctx.params.paymentSessionCode); //Necesita un await?
				if(erpResponse && erpResponse.STATUS && erpResponse.STATUS === 'OK'){
					await erpServices.addStatus(userData.paymentSession, Koa.config.states.closed, Koa.config.codes.payment.itau, Koa.config.codes.currency.clp, userData.preExchange.id, userData.spentPoints, {
						 rut: userData.rut + '-' + userData.dv
						,paymentId:exchangeData.id
					});
				}

				await userSessionModel.updateUserSession(ctx.authSession.paymentIntentionId, userData);
				
				ctx.body = {
					status: 'Complete',
					url: null
				};
			} catch (err) {
				Koa.log.error(err);
				// Alguna forma de que quede pendiente validar el cobro de los puntos en un cron

				ctx.body = {
					status: 'PointsPending',
					url: null
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
	if (await sessionPaymentServices.isValidAttempt(ctx) && ctx.authType === 'sessionOpen') {
		if (userData.preExchange && !userData.postExchange && userData.extraExchange) {
			ctx.params.rut = userData.rut;
			ctx.params.dv = userData.dv;
			ctx.params.preExchangeId = userData.preExchange.id;
			let canceledPreExchangeData = await itauServices.cancelPreExchange(ctx);
			await erpServices.addStatus(userData.paymentSession, Koa.config.states.failed, Koa.config.codes.payment.itau, Koa.config.codes.currency.clp, userData.preExchange.id, userData.spentPoints, {
				rut: userData.rut + '-' + userData.dv
			});
			await erpServices.addStatus(userData.paymentSession, Koa.config.states.failed, Koa.config.codes.payment.webpay, Koa.config.codes.currency.clp, userData.extraExchange.tokenWebPay, userData.coPayment, {});			
		}
		await sessionPaymentServices.remove(ctx);
		ctx.body = {
			status: 'Complete'
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
	ctx.body = await erpServices.checkPendingPayments();
}