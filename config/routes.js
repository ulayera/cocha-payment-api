'use strict';
/* jshint strict: false, esversion: 6 */

module.exports = {
	'/test/:id': {
		method: 'GET',
		controller: 'TestController',
		action: 'test',
		auth: {
			strategy: 'strategy',
			redirect: null,
		}
	}
};