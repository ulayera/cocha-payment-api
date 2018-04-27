'use strict';
/* jshint strict: false, esversion: 6 */

module.exports = {
	'POST /redeem': {
		controller: 'ErpController',
		action: 'assignTransaction'
	},
	'GET /checkStatus/:sessionToken/:xpnr': {
		controller: 'ErpController',
		action: 'checkTransaction'
	},
};
