'use strict';
/* jshint strict: false, esversion: 6 */

const webServices = require('cocha-external-services').webServices;
const logService = require('./LogService');

const codeSrc = Koa.config.codes.source;

async function reportPay(_ctx) {
	let code = codeSrc[_ctx.authSession.userSessionData.productSrc];
	let url = Koa.config.path.confirmation.reportPay;
	let params = {
		paymentSessionCode: code + _ctx.params.paymentSessionCode
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
	reportPay: reportPay
};