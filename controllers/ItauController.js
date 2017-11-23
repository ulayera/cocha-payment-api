'use strict';
/* jshint strict: false, esversion: 6 */

const paymentSessionServices = require('cocha-external-services').paymentSession;
const paymentServices = require('cocha-external-services').paymentServices;
const userSessionModel = require('../models/redis/UserSession');
const itauService = require('../services/ItauService');

async function getPaymentSession(ctx) {
	let paymentSessionData = await new Promise((resolve, reject) => {
		paymentSessionServices.get(ctx.params.paymentSessionCode, (err, result) => {
			if (err) {
				reject(err);
			} else {
				resolve(result);
			}
		});
	});

	ctx.body = {
		status: 'Complete',
		product: paymentSessionData.data.productName,
		origin: paymentSessionData.data.origin || "Santiago, Chile",
		destination: paymentSessionData.data.destination,
		departure: paymentSessionData.data.departure,
		returning: paymentSessionData.data.returning,
		numberRooms: paymentSessionData.data.rooms
	};
}

async function loadClient(ctx) {
	let paymentSessionValid = await new Promise((resolve, reject) => {
		paymentSessionServices.isValidNewAttempt(ctx.params.paymentSessionCode, (ctx.params.rut + '-' + ctx.params.dv), ctx.authSession.paymentIntentionId, (err, result) => {
			if (err) {
				reject(err);
			} else {
				resolve(result);
			}
		});
	});
	if (paymentSessionValid) {
		let userData = await itauService.validateRut(ctx);

		userData.paymentSession = ctx.params.paymentSessionCode;

		ctx.params.phoneNumber = userData.phoneNumber;
		ctx.params.email = userData.email;
		let dynamicKeyData = await itauService.generateDynamicKey(ctx); 

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

async function sendDynamicKey (ctx) {
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
	let dynamicKeyData = await itauService.generateDynamicKey(ctx);
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
		let checkDynamicKeyData = await itauService.checkDynamicKey(ctx); 
		userData.dynamicKey.checkingStatus = checkDynamicKeyData.checkingStatus
	} catch(err) {
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

	let	startSessionData = await itauService.startSession(ctx)
	userData.expiration = startSessionData.expiration;

	let sessionFlowData  = await itauService.validateSessionFlow(ctx);
	userData.totalPoints = sessionFlowData.availablePoints;
	userData.availablePoints = sessionFlowData.availablePoints;

	let paymentSessionData = await new Promise((resolve, reject) => {
		paymentSessionServices.get(userData.paymentSession, (err, result) => {
			if (err) {
				reject(err);
			} else {
				resolve(result);
			}
		});
	});
	userData.cpnr = paymentSessionData.data.cpnr;
	userData.producId = paymentSessionData.data.producId;
	userData.productName = paymentSessionData.data.productName;
	userData.price = paymentSessionData.data.price;

	await new Promise((resolve, reject) => {
		paymentSessionServices.addAttempt(userData.paymentSession, (userData.rut + '-' + userData.dv), ctx.authSession.paymentIntentionId, (err, result) => {
			if (err) {
				reject(err);
			} else {
				resolve(result);
			}
		});
	});

	await userSessionModel.updateUserSession(ctx.authSession.paymentIntentionId, userData, 'sessionOpen');

	ctx.body = {
		status: 'Complete',
		points: userData.totalPoints
	};
}

async function executePayment(ctx) {
	let userData = ctx.authSession.userSessionData;
	let sessionValidData = await new Promise((resolve, reject) => {
		paymentSessionServices.isValidAttempt(userData.paymentSession, ctx.authSession.paymentIntentionId, (err, result) => {
			if (err) {
				reject(err);
			} else {
				resolve(result);
			}
		});
	});
	if (sessionValidData && ctx.authType === 'sessionOpen') {
		ctx.params.rut = userData.rut;
		ctx.params.dv = userData.dv;
		ctx.params.dynamicKeyId = userData.dynamicKey.id;
		let preExchangeData = await itauService.requestPreExchange(ctx);
		userData.availablePoints = preExchangeData.availablePoints;
		userData.spentPoints = preExchangeData.spentPoints;
		delete preExchangeData.availablePoints;
		delete preExchangeData.spentPoints;
		userData.preExchange = preExchangeData;



		if (userData.spentPoints === userData.price.usd) {
			try {
				userData.extraExchange = null;

				await itauService.validateClient(ctx);

				ctx.params.preExchangeId = userData.preExchange.id;
				ctx.params.extraExchangeAmount = 0;
				ctx.params.productName = userData.productName;
				ctx.params.productId = userData.producId;
				let exchangeData = await itauService.requestExchange(ctx);
				
				userData.postExchange = exchangeData;
			} catch(err) {
				Koa.log.error(err);
				ctx.params.preExchangeId = userData.preExchange.id;
				let canceledPreExchangeData = await itauService.cancelPreExchange(ctx);

				throw err;
			}
		} else {
			try {
				let params = {
					amount: userData.price.usd - userData.spentPoints,
					code: userData.producId,
					appName: 'PKG.COCHA.COM-DESA'
				};
				let paymentData = await new Promise((resolve, reject) => {
					paymentServices.getPaymentData(params, (err, result) => {
						if (err) {
							reject(err);
						} else {
							resolve(result);
						}
					}, ctx.authSession);
				});
				userData.extraExchange = paymentData;
			} catch(err) {
				Koa.log.error(err);
				ctx.params.preExchangeId = userData.preExchange.id;
				let canceledPreExchangeData = await itauService.cancelPreExchange(ctx);

				throw err;
			}
		}

		await userSessionModel.updateUserSession(ctx.authSession.paymentIntentionId, userData);
		
		ctx.body = {
			status: (userData.extraExchange)? 'Pending' : 'Complete',
			points: userData.availablePoints,
			url: (userData.extraExchange)? userData.extraExchange.url : null
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


async function cancelPreExchange(ctx) {
	let params = {
		rut: ctx.params.rut,
		dv: ctx.params.dv, 
		proveedor_id: ctx.params.proveedor_id,
		precanje_id: ctx.params.precanje_id,
		producto_id: ctx.params.producto_id
	}
}

module.exports = {
	getPaymentSession: getPaymentSession,
	loadClient: loadClient,
	sendDynamicKey:sendDynamicKey,
	validateDynamicKey:validateDynamicKey,
	executePayment:executePayment,
	cancelPreExchange:cancelPreExchange
};
