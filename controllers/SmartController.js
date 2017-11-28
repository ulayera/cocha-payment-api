'use strict';
/* jshint strict: false, esversion: 6 */

const smartService = require('../services/smartService');

async function sendPayment(ctx){

	let result = await smartService.sendPayment();

	ctx.body = {
		result:result
	};
}

async function burnPoints(ctx){
	let result = await smartService.burnPoints();

	ctx.body = {
		result:result
	};

}


modules.exports = {
	sendPayment: sendPayment,
	burnPoints: burnPoints
};