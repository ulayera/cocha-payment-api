'use strict';
/* jshint strict: false, esversion: 6 */

module.exports = {
	'/setPayment' : {
		method: 'POST',
		controller: 'PaymentController',
		action: 'createPayment',
		auth: null
	},
	'/getPaymentSession/:paymentSessionCode': {
		method: 'GET',
		controller: 'ItauController',
		action: 'getPaymentSession',
		auth: {
			strategy: 'intentionStrategy',
			redirect: null
		}
	},
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
	'/validateDynamicKey' : {
		method: 'POST',
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
	'/quemarPuntos' : {
		method: 'POST' ,
		controller: 'ErpController',
		action: 'assignTransaction'
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

