'use strict';
/* jshint strict: false, esversion: 6 */

module.exports = {
	'POST /setPayment': {
		controller: 'PaymentController',
		action: 'create',
		auth: null
	},
	'GET /statusPayment/:paymentSessionCode/:appCode': {
		controller: 'PaymentController',
		action: 'getStatus',
		auth: null
	},
	'GET /getPaymentSession/:paymentSessionCode': {
		controller: 'ItauController',
		action: 'getPaymentSession',
		auth: {
			strategy: 'intentionStrategy',
			redirect: null
		}
	},
	'GET /loadClient/:paymentSessionCode/:rut/:dv': {
		controller: 'ItauController',
		action: 'loadClient',
		auth: {
			strategy: 'intentionStrategy',
			redirect: null
		}
	},
	'GET /sendDynamicKey': {
		controller: 'ItauController',
		action: 'sendDynamicKey',
		auth: {
			strategy: 'paymentIntentionStrategy',
			redirect: null
		}
	},
	'POST /validateDynamicKey': {
		controller: 'ItauController',
		action: 'validateDynamicKey',
		auth: {
			strategy: 'paymentIntentionStrategy',
			redirect: null
		}
	},
	'POST /executePayment': {
		controller: 'ItauController',
		action: 'executePayment',
		auth: {
			strategy: 'paymentIntentionStrategy',
			redirect: null
		}
	},
	'GET /checkPayment': {
		controller: 'ItauController',
		action: 'checkPayment',
		auth: {
			strategy: 'paymentIntentionStrategy',
			redirect: null
		}
	},
	'GET /cancelPayment': {
		controller: 'ItauController',
		action: 'cancelPayment',
		auth: {
			strategy: 'paymentIntentionStrategy',
			redirect: null
		}
	},
	'POST /redeem': {
		controller: 'ErpController',
		action: 'assignTransaction'
	},
	'GET /checkStatus/:sessionToken/:xpnr': {
		controller: 'ErpController',
		action: 'checkTransaction'
	},
	'GET /test' : {
		controller: 'ItauController',
		action: 'test'
	}
};
