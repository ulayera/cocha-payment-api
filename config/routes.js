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
	'/checkPayment' : { 
		method: 'GET',
		controller: 'ItauController',
		action: 'checkPayment',
		auth:  {
			strategy: 'paymentIntentionStrategy',
			redirect: null
		}
	},
	'/cancelPayment' : {
		method: 'GET',
		controller: 'ItauController',
		action: 'cancelPayment', 
		auth: {
			strategy: 'paymentIntentionStrategy',
			redirect: null
		} 
	},
	'/redeem' : {
		method: 'POST' ,
		controller: 'ErpController',
		action: 'assignTransaction'
	},
	'/checkStatus/:sessionToken/:cpnr' : {
		method: 'GET' ,
		controller: 'ErpController',
		action: 'checkTransaction'
	}
};

