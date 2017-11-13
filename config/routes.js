'use strict';
/* jshint strict: false, esversion: 6 */

module.exports = {
	'/loadClient/:paymentSessionCode/:rut/:dv': {
		method: 'GET',
		controller: 'ItauController',
		action: 'loadClient',
		auth: {
			strategy: 'intentionStrategy',
			redirect: null
		}
	},
	'/sendDynamicKey' : {
		method:	'GET',
		controller: 'ItauController',
		action: 'sendDynamicKey', 
		auth: {
			strategy: 'paymentIntentionStrategy',
			redirect: null
		} 
	},
	'/validateDynamicKey/:dynamicKey' : {
		method: 'GET',
		controller: 'ItauController',
		action: 'validateDynamicKey',
		auth: {
			strategy: 'paymentIntentionStrategy',
			redirect: null
		}
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

