'use strict';
/* jshint strict: false, esversion: 6 */

function validateRut(ctx) {
	let params = {
		rut: ctx.params.rut,
		dv: ctx.params.dv
	};
	ctx.body = 'El arbol de la tecnologia';

}
function dynamicPasswordGenerator(ctx) {
	let params = {
		rut: ctx.params.rut,
		dv: ctx.params.dv,
		proveedor_id: ctx.params.proveedor_id,
		telefono: ctx.params.telefono,
		email: ctx.params.email
	};
}
function dynamicPasswordCheck(ctx) { 
	let params = { 
		rut: ctx.params.rut,
		dv: ctx.params.dv,
		proveedor_id: ctx.params.proveedor_id,
		clave_generada: ctx.params.clave_generada,
		clave_id_generada: ctx.params.clave_id_generada
	}
}
function login(ctx) {
	let params = {
		rut: ctx.params.rut, 
		dv: ctx.params.dv,
		proveedor_id: ctx.params.proveedor_id,
		clave_id_generada: ctx.params.clave_id_generada
	}
}
function validateCustomFlow(ctx) {
	let params = {
		rut: ctx.params.rut, 
		dv: ctx.params.dv,
		proveedor_id: ctx.params.proveedor_id,
		clave_id_generada: ctx.params.clave_id_generada,
		clave_generada: ctx.params.clave_generada,
		numero_pagina: ctx.params.numero_pagina
	}

	}
function preExchangeRequest(ctx) {
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
function validateClientStatus(ctx) { 
	let params = {
		rut: ctx.params.rut, 
		dv: ctx.params.dv
	}
}
function performExchange(ctx) { 
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
	function cancelPreExchange(ctx) {
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
	dynamicPasswordGenerator:dynamicPasswordGenerator,
	dynamicPasswordCheck:dynamicPasswordCheck, 
	login:login,
	validateCustomFlow:validateCustomFlow,
	preExchangeRequest:preExchangeRequest,
	validateClientStatus:validateClientStatus,
	performExchange: performExchange,
	cancelPreExchange:cancelPreExchange

};
