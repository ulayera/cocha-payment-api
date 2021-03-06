'use strict';
/* jshint strict: false, esversion: 6 */

const webServices = require('cocha-external-services').webServices;
const logService = require('./LogService');

const codeSrc = Koa.config.codes.source;

async function reportPay(args) {
	let code = codeSrc[args.productSrc];
	let url = Koa.config.path.confirmation.reportPay;
	let params = {
		paymentSessionCode: code + args.sessionId
	};
  args.authSession.logFunction = logService.logCallToService;
  console.log("ConfirmationService.reportPay -> " + url + "\n" + JSON.stringify(params, null, 2));
	let data = await new Promise((resolve, reject) => {
		webServices.get('payment', url, params, null, (err, result) => {
			if (err) {
				reject(err);
			} else {
				resolve(result);
			}
		}, args.authSession);
	});
	return data;
}

module.exports = {
	reportPay: reportPay
};