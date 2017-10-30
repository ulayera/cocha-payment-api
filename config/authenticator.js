'use strict';
/* jshint strict: false, esversion: 6 */

module.exports = {
	strategy: async (_headers, _params) => {
		return {
			type: '',
			sessionData: {}
		};
	}
};