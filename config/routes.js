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
	'/executePayment' : {
		method: 'POST' ,
		controller: 'ItauController',
		action: 'executePayment',
		auth: {
			strategy: 'paymentIntentionStrategy',
			redirect: null
		} 
	},

	
	'cancelpreexchange/:rut/:dv/:proveedor_id/:precanje_id/:producto_id' : {
		method: 'GET',
		controller: 'ItauController',
		action: 'cancelpreexchange', 
		auth: {
			strategy: 'paymentIntentionStrategy',
			redirect: null
		} 
	}
};

