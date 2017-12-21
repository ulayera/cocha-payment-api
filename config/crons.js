'use strict';
/* jshint strict: false, esversion: 6 */

module.exports = {
	checkPendingPayments: {
		time: '0 * * * *',
		service: 'ItauService',
		action: 'checkPendingPayments'
	}	
};