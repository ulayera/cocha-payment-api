'use strict';
/* jshint strict: false, esversion: 6 */

const paymentServices = require('cocha-external-services').paymentServices;
const userSessionModel = require('../models/redis/UserSession');
const itauService = require('../services/ItauService');

async function loadClient(ctx) {
	if (true) { //ctx.params.paymentSessionCode es valido?
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
	if (true) { //ctx.params.paymentSessionCode es valido?
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
}

async function validateDynamicKey(ctx) { 
	let userData = ctx.authSession.userSessionData;
	if (true) { //ctx.params.paymentSessionCode es valido?
		ctx.params.rut = userData.rut;
		ctx.params.dv = userData.dv;
		ctx.params.dynamicKeyId = userData.dynamicKey.id;
		try {
			let checkDynamicKeyData = await itauService.checkDynamicKey(ctx); 
			userData.dynamicKey.checkingStatus = checkDynamicKeyData.checkingStatus
		} catch(err) {
			if ((err.code === 'ActionError-150' || err.code === 'ActionError-151') && userData.dynamicKey.attempts > 2) {
				throw {
					status: 401,
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

		// Informacion que sale de la sesion de pago
		userData.productName = 'Viaje de Prueba';
		userData.pnr = 'HUOSDB';
		userData.price = 850;

		await userSessionModel.updateUserSession(ctx.authSession.paymentIntentionId, userData, 'sessionOpen');

		ctx.body = {
			status: 'Complete',
			points: userData.totalPoints
		};
	}
}

async function executePayment(ctx) {
	let userData = ctx.authSession.userSessionData;
	if (true) { //ctx.params.paymentSessionCode es valido?
		ctx.params.rut = userData.rut;
		ctx.params.dv = userData.dv;
		ctx.params.dynamicKeyId = userData.dynamicKey.id;
		let preExchangeData = await itauService.requestPreExchange(ctx);
		userData.availablePoints = preExchangeData.availablePoints;
		userData.spentPoints = preExchangeData.spentPoints;
		delete preExchangeData.availablePoints;
		delete preExchangeData.spentPoints;
		userData.preExchange = preExchangeData;

		let TEMP;
		if (userData.spentPoints === userData.price) {
			try {
				userData.extraExchange = null;

				let clientStatusData = await itauService.validateClient(ctx);
				//Canjear puntos

				ctx.params.preExchangeId = userData.preExchange.id;
				ctx.params.extraExchangeAmount = 0;
				ctx.params.productName = userData.productName;
				ctx.params.productId = userData.pnr;
				let exchangeData = await itauService.requestExchange(ctx);

				TEMP = {
					statusClient: clientStatusData,
					exchange: exchangeData
				};

				ctx.params.dynamicKey = userData.dynamicKey.key;//TEmporal
				await itauService.validateSessionFlow(ctx); //TEmporal
			} catch(err) {
				ctx.params.preExchangeId = userData.preExchange.id;
				let canceledPreExchangeData = await itauService.cancelPreExchange(ctx);

				throw err;
			}
		} else {
			try {
				let params = {
					amount: userData.price - ctx.params.spendingPoint,
					pnr: userData.pnr,
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
				//Mapear sesion de pago con token(o codigo de url?)
			} catch(err) {
				ctx.params.preExchangeId = userData.preExchange.id;
				let canceledPreExchangeData = await itauService.cancelPreExchange(ctx);

				throw err;
			}
		}

		await userSessionModel.updateUserSession(ctx.authSession.paymentIntentionId, userData);
		
		ctx.body = {
			status: (userData.extraExchange)? 'Pending' : 'Complete',
			temp: TEMP,
			points: userData.availablePoints,
			url: (userData.extraExchange)? userData.extraExchange.url : null
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
	loadClient: loadClient,
	sendDynamicKey:sendDynamicKey,
	validateDynamicKey:validateDynamicKey,
	executePayment:executePayment,
	cancelPreExchange:cancelPreExchange
};
