'use strict';
/* jshint strict: false, esversion: 6 */

module.exports = {
	'/validaterut/:rut/:dv': {
		method: 'GET',
		controller: 'ItauController',
		action: 'validateRut',
		auth: null
	},
	'/senddynamickey' : {
		method:	'GET',
		controller: 'ItauController',
		action: 'sendDynamicKey', 
		auth: null 
	},
	'/checkdynamickey/:rut/dv/:proveedor_id/:clave_generada/:clave_id_generada' : {
		method: 'GET',
		controller: 'ItauController',
		action: 'checkDynamicKey',
		auth: null 
	},
	'/login/:rut/:dv/:proveedor_id/:clave_id_generada' : { 
		method: 'GET', 
		controller: 'ItauController',
		action:	'login',
		auth: null 
	},
	'validatecustomflow/:rut/:dv/:proveedor_id/:clave_id_generada/:clave_generada/:numero_pagina' : {
		method: 'GET',
		controller: 'ItauController',
		action: 'validatecustomflow',
		auth: null 
	},
	'preexchangerequest/:rut/:dv/:proveedor_id/:clave_id_generado/:valor_producto/:cantidad_producto/:producto_id/:saldo_cliente/:precanje_id' : {
		method: 'GET' ,
		controller: 'ItauController',
		action: 'preexchangerequest',
		auth: null 
	},
	'validateclientstatus/:rut/:dv'		: {
		method: 'GET', 
		controller: 'ItauController' , 
		action: 'validateclientstatus',
		auth: null 
},
	'performexchange/:rut/:dv/:proveedor_id/:precanje_id/:puntos_utilizados/:copago/:glosa_canje/:orden_compra' : {
		method: 'GET' ,
		controller: 'ItauController',
		action: 'performexchange', 
		auth: null 
	},
	'cancelpreexchange/:rut/:dv/:proveedor_id/:precanje_id/:producto_id' : {
		method: 'GET',
		controller: 'ItauController',
		action: 'cancelpreexchange', 
		auth: null 
	}
};

