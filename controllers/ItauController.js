'use strict';
/* jshint strict: false, esversion: 6 */

const userSessionModel = require('../models/redis/UserSession');
const itauService = require('../services/ItauService');

async function validateRut(ctx) {
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
	if (userData.dynamicKey.attempts > 3) {
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

		// dynamicKeyData.attempts = userData.dynamicKey.attempts + 1 //Testing
		userData.dynamicKey = dynamicKeyData;
		userSessionModel.updateUserSession(ctx.authSession.paymentIntentionId, userData);

		ctx.body = {
			status: 'Complete',
			name: userData.name,
			phone: userData.phoneNumber,
			expireDate: dynamicKeyData.expiration 
		}; 
	}
}

async function checkDynamicKey(ctx) { 
	let userData = ctx.authSession.userSessionData;
	if (true) { //ctx.params.paymentSessionCode es valido?
		ctx.params.rut = userData.rut;
		ctx.params.dv = userData.dv;
		ctx.params.dynamicKeyId = userData.dynamicKey.id;
		let checkDynamicKey = await itauService.checkDynamicKey(ctx); 

		let	startSessionData = await itauService.startSession(ctx)
		userData.session = startSessionData
		userSessionModel.updateUserSession(ctx.authSession.paymentIntentionId, userData)
	
		ctx.body = {
			status: 'Complete',
			name: userData.name,
			phone: userData.phoneNumber,
			expireDate: dynamicKeyData.expiration
		};
	}
}

// async function startSession(ctx) {
//	let params = {
//		rut: ctx.params.rut, 
//		dv: ctx.params.dv,
//		proveedor_id: ctx.params.proveedor_id,
//		clave_id_generada: ctx.params.clave_id_generada
//	}
// }

async function validateCustomFlow(ctx) {
	let params = {
		rut: ctx.params.rut, 
		dv: ctx.params.dv,
		proveedor_id: ctx.params.proveedor_id,
		clave_id_generada: ctx.params.clave_id_generada,
		clave_generada: ctx.params.clave_generada,
		numero_pagina: ctx.params.numero_pagina
	}
}

async function preExchangeRequest(ctx) {
	let params = {
		rut: ctx.params.rut,
		dv: ctx.params.dv,
		proveedor_id: ctx.params.proveedor_id,
		clave_id_generado: ctx.params.clave_id_generado,
		valor_producto: ctx.params.valor_producto,
		cantidad_producto: ctx.params.cantidad_producto,
		producto_id: ctx.params.producto_id,
		saldo_cliente: ctx.params.saldo_cliente,
		precanje_id: ctx.params.precanje_id
	}
}

async function validateClientStatus(ctx) { 
	let params = {
		rut: ctx.params.rut, 
		dv: ctx.params.dv
	}
}

async function performExchange(ctx) { 
	let params = {
		rut: ctx.params.rut,
		dv: ctx.params.rut,
		proveedor_id: ctx.params.proveedor_id,
		precanje_id: ctx.params.precanje_id,
		puntos_utilizados: ctx.params.puntos_utilizados,
		copago: ctx.params.copago,
		glosa_canje: ctx.params.glosa_canje,
		orden_compra: ctx.params.orden_compra
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
	validateRut: validateRut,
	sendDynamicKey:sendDynamicKey,
	checkDynamicKey:checkDynamicKey, 
	login:login,
	validateCustomFlow:validateCustomFlow,
	preExchangeRequest:preExchangeRequest,
	validateClientStatus:validateClientStatus,
	performExchange: performExchange,
	cancelPreExchange:cancelPreExchange

};
