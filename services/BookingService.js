'use strict';
/* jshint strict: false, esversion: 6 */

const webServices = require('cocha-external-services').webServices;
const logService = require('./LogService');

async function emit(_ctx) {
	let url = Koa.config.path.booking.emit;
	let params = {
		sessionid: _ctx.params.paymentSessionCode,
		cochaCode: _ctx.params.cochaCode
	};
  _ctx.authSession.logFunction = logService.logCallToService;
	let data = await new Promise((resolve, reject) => {
		webServices.get('payment', url, params, null, (err, result) => {
			if (err) {
				reject(err);
			} else {
				resolve(result);
			}
		}, _ctx.authSession);
	});  
	return data;
}

module.exports = {
	emit: emit
};