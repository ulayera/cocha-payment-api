'use strict';
/* jshint strict: false, esversion: 6 */

module.exports = {
	'/setPayment': {
		method: 'POST',
		controller: 'PaymentController',
		action: 'create',
		auth: null
	},
	'/statusPayment/:paymentSessionCode/:appCode': {
		method: 'GET',
		controller: 'PaymentController',
		action: 'getStatus',
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
	'/sendDynamicKey': {
		method: 'GET',
		controller: 'ItauController',
		action: 'sendDynamicKey',
		auth: {
			strategy: 'paymentIntentionStrategy',
			redirect: null
		}
	},
	'/validateDynamicKey': {
		method: 'POST',
		controller: 'ItauController',
		action: 'validateDynamicKey',
		auth: {
			strategy: 'paymentIntentionStrategy',
			redirect: null
		}
	},
	'/executePayment': {
		method: 'POST',
		controller: 'ItauController',
		action: 'executePayment',
		auth: {
			strategy: 'paymentIntentionStrategy',
			redirect: null
		}
	},
	'/checkPayment': {
		method: 'GET',
		controller: 'ItauController',
		action: 'checkPayment',
		auth: {
			strategy: 'paymentIntentionStrategy',
			redirect: null
		}
	},
	'/cancelPayment': {
		method: 'GET',
		controller: 'ItauController',
		action: 'cancelPayment',
		auth: {
			strategy: 'paymentIntentionStrategy',
			redirect: null
		}
	},
	'/redeem': {
		method: 'POST',
		controller: 'ErpController',
		action: 'assignTransaction'
	},
	'/checkStatus/:sessionToken/:xpnr': {
		method: 'GET',
		controller: 'ErpController',
		action: 'checkTransaction'
	},
	'/test': {
		method: 'GET',
		controller: 'ItauController',
		action: 'test'
	},
  /* public */
  "/sessions": {
    method: 'POST',
    controller: 'SessionsController',
    action: 'createSession',
    auth: null
  },
  /* public */
  "/sessions/:sessionId/status": {
    method: 'GET',
    controller: 'SessionsController',
    action: 'checkStatus',
    auth: null
  },
  /* protected */
  "/sessions/:sessionId/": {
    method: 'GET',
    controller: 'SessionsController',
    action: 'getSession',
    auth: null
  },
  /* protected */
  "/methods/": {
    method: 'GET',
    controller: 'MainController',
    action: 'getMethods',
    auth: null
  },
  /* protected */
  "/sessions/:sessionId/charges": {
    method: 'POST',
    controller: 'ChargesController',
    action: 'createCharge',
    auth: null
  },
  /* protected */
  "/sessions/:sessionId/charges/:chargeId": {
    method: 'GET',
    controller: 'ChargesController',
    action: 'getCharge',
    auth: null
  }
};