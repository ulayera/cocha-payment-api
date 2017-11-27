'use strict';
/* jshint strict: false, esversion: 6 */

const paymentSessionServices = require('cocha-external-services').paymentSession;
const paymentServices = require('cocha-external-services').paymentServices;



const userSessionModel = require('../models/redis/UserSession');
const sessionPaymentService = require('../services/SessionPaymentService');
const itauService = require('../services/ItauService');
const Payment = require('../models/mongo/schemas/payment');


async function getPaymentSession(ctx) {
	let paymentSessionData = await sessionPaymentService.get(ctx); 


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
		infants: paymentSessionData.data.infants,

	};
}

async function loadClient(ctx) {
	ctx.params.idDocument = ctx.params.rut + '' + ctx.params.dv
	if (await sessionPaymentService.isValidNewAttempt(ctx)) {
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

	ctx.params.paymentSessionCode = userData.paymentSession;
	let paymentSessionData = await sessionPaymentService.get(ctx); 
	userData.cochaCode = paymentSessionData.data.cochaCode;
	userData.cpnr = paymentSessionData.data.cpnr;
	userData.productName = paymentSessionData.data.productName;
	userData.price = paymentSessionData.data.price;

	ctx.params.idDocument = userData.rut + '' + userData.dv;
	await sessionPaymentService.addAttempt(ctx); 
	await userSessionModel.updateUserSession(ctx.authSession.paymentIntentionId, userData, 'sessionOpen');

	ctx.body = {
		status: 'Complete',
		points: userData.totalPoints
	};
}

async function executePayment(ctx) {
	let userData = ctx.authSession.userSessionData;
	ctx.params.paymentSessionCode = userData.paymentSession;
	if (await sessionPaymentService.isValidAttempt(ctx) && ctx.authType === 'sessionOpen') {
		if (!_.isNumber(ctx.params.spendingPoint)) {
			throw {
				status: 400,
				message: {
					code: 'ParamsError',
					msg: "Parameter 'spendingPoint' is invalid: " + ctx.params.spendingPoint
				}
			};
		} 
		ctx.params.spendingPoint = (ctx.params.spendingPoint > userData.price)? userData.price : ctx.params.spendingPoint;

		ctx.params.rut = userData.rut;
		ctx.params.dv = userData.dv;
		ctx.params.dynamicKeyId = userData.dynamicKey.id;
		let preExchangeData = await itauService.requestPreExchange(ctx);
		
		await ErpService.addStatus(ctx.params.paymentSessionCode,"PENDIENTE","ITAU","CLP",preExchangeData.id,preExchangeData.spentPoints,{rut:ctx.params.rut});

		userData.availablePoints = preExchangeData.availablePoints;
		userData.spentPoints = preExchangeData.spentPoints;
		delete preExchangeData.availablePoints;
		delete preExchangeData.spentPoints;
		userData.preExchange = preExchangeData;
		
		if (userData.spentPoints === userData.price) {
			try {
				userData.extraExchange = null;

				await itauService.validateClient(ctx);



				ctx.params.preExchangeId = userData.preExchange.id;
				ctx.params.extraExchangeAmount = 0;
				ctx.params.productName = userData.productName;
				ctx.params.cpnr = userData.cpnr;
				let exchangeData = await itauService.requestExchange(ctx);

				await ErpService.addStatus(ctx.params.paymentSessionCode,"PAGADO","ITAU","CLP",preExchangeData.id,preExchangeData.spentPoints,{rut:ctx.params.rut});
				
				userData.postExchange = exchangeData;
			} catch(err) {
				Koa.log.error(err);
				ctx.params.preExchangeId = userData.preExchange.id;
				let canceledPreExchangeData = await itauService.cancelPreExchange(ctx);

				await ErpService.addStatus(ctx.params.paymentSessionCode,"FALLO","ITAU","CLP",preExchangeData.id,preExchangeData.spentPoints,{rut:ctx.params.rut});

				throw err;
			}
		} else {
			try {
				let params = {
					amount: userData.price - userData.spentPoints,
					code: userData.cpnr,
					appName: 'PKG.COCHA.COM-DESA' //Definir en los configs
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

				await ErpService.addStatus(ctx.params.paymentSessionCode,"PENDIENTE","WEBPAY","CLP",paymentData.tokenWebPay,params.amount,{rut:ctx.params.rut,token:paymentData.token});				

			} catch(err) {
				Koa.log.error(err);
				ctx.params.preExchangeId = userData.preExchange.id;
				let canceledPreExchangeData = await itauService.cancelPreExchange(ctx);
				
				await ErpService.addStatus(ctx.params.paymentSessionCode,"FALLO","ITAU","CLP",preExchangeData.id,userData.spentPoints,{rut:ctx.params.rut});
				
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

async function validatePayment(ctx) {
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
			try {

			await itauService.validateClient(ctx);

			ctx.params.preExchangeId = userData.preExchange.id;
			ctx.params.productName = userData.productName;
			ctx.params.productId = userData.producId;
			
		} catch(err) {
			Koa.log.error(err);
			ctx.params.preExchangeId = userData.preExchange.id;
			let canceledPreExchangeData = await itauService.cancelPreExchange(ctx);

			throw err;
		}

		
		if (token === null && status != 0) { 
			await itauService.cancelPreExchange(ctx);
			}	
			
			if (token != null ){
	
			
		try { 
				let params = { 
					token: 'd2de7f089d2f736a8c2345113add65a5',
					message: '',
					tokenWebPay: '',
					url: '',
					pnr: userData.pnr

			};
				let paymentData = await new Promise((resolve, reject) => {
					paymentServices.checkPayment(params, (err, result) => {
						if (err) {
							reject(err);
						} else {
							resolve(result);
						}
					}, ctx.authSession);
				});
				userData.extraExchange = paymentData;
				let exchangeData = await itauService.requestExchange(ctx);
				
				userData.postExchange = exchangeData;
				
			} catch(err) { 
				ctx.params.preExchangeId = userData.preExchange.id;
				let canceledPreExchangeData = await itauService.cancelPreExchange(ctx);
				throw err; 
			}
		}
	}
			//await userSessionModel.updateUserSession(ctx.authSession.paymentIntentionId, userData);

		ctx.body = { 
			status: 'COMPLETE'
	};


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
	cancelPreExchange:cancelPreExchange,
	validatePayment:validatePayment
};
