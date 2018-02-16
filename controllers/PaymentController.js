'use strict';
/* jshint strict: false, esversion: 6 */

const sessionPaymentService = require('../services/SessionPaymentService');

const validSrc = Object.keys(Koa.config.codes.source);

async function create(ctx) {
  let errors = [];
  if (!_.isString(ctx.params.ccode) || _.isEmpty(ctx.params.ccode)) {
    errors.push("Parameter 'ccode' is invalid: " + ctx.params.ccode);
  }
  if (!_.isString(ctx.params.paymentSrc) || _.isEmpty(ctx.params.paymentSrc) || !_.includes(validSrc, ctx.params.paymentSrc)) {
    errors.push("Parameter 'paymentSrc' is invalid: " + ctx.params.paymentSrc);
  }
  if (!_.isString(ctx.params.title) || _.isEmpty(ctx.params.title)) {
    errors.push("Parameter 'title' is invalid: " + ctx.params.title);
  }
  if (!_.isNumber(ctx.params.clpPrice)) {
    errors.push("Parameter 'clpPrice' is invalid: " + ctx.params.clpPrice);
  }
  if (!_.isString(ctx.params.origin) || _.isEmpty(ctx.params.origin)) {
    errors.push("Parameter 'origin' is invalid: " + ctx.params.origin);
  }
  if (!_.isString(ctx.params.destination) || _.isEmpty(ctx.params.destination)) {
    errors.push("Parameter 'destination' is invalid: " + ctx.params.destination);
  }
  if (!moment(ctx.params.departureDate).isValid()) {
    errors.push("Parameter 'departureDate' is invalid: " + ctx.params.departureDate);
  }
  if (!moment(ctx.params.returningDate).isValid()) {
    errors.push("Parameter 'returningDate' is invalid: " + ctx.params.returningDate);
  }
  if (!_.isString(ctx.params.contactEmail) || _.isEmpty(ctx.params.contactEmail)) {
    errors.push("Parameter 'contactEmail' is invalid: " + ctx.params.contactEmail);
  }
  if (!_.isString(ctx.params.wappOkUrl) || _.isEmpty(ctx.params.wappOkUrl)) {
    errors.push("Parameter 'wappOkUrl' is invalid: " + ctx.params.wappOkUrl);
  }
  if (!_.isString(ctx.params.wappErrorUrl) || _.isEmpty(ctx.params.wappErrorUrl)) {
    errors.push("Parameter 'wappErrorUrl' is invalid: " + ctx.params.wappErrorUrl);
  }
  if (!_.isNumber(ctx.params.totalRooms)) {
    errors.push("Parameter 'totalRooms' is invalid: " + ctx.params.totalRooms);
  }
  if (!_.has(ctx.params, 'adult') || !_.has(ctx.params, 'child') || !_.has(ctx.params, 'infant') || !_.isNumber(ctx.params.adult + ctx.params.child + ctx.params.infant)) {
    errors.push("Parameters 'adult', 'child' or 'infant' are invalids: " + ctx.params.adult + ", " + ctx.params.child + ", " + ctx.params.infant);
  }
  if (errors.length > 0) {
    throw {
      status: 400,
      message: {
        code: 'ParamsError',
        msg: errors
      }
    };
  }

  let paymentSessionId = await sessionPaymentService.create(ctx);

	ctx.body = {
    status: 'Complete',
    paymentToken: paymentSessionId,
    url: Koa.config.paymentWappUrl.replace(':sessionid', paymentSessionId)
	};
}

async function getStatus(ctx) {
  if (ctx.params.appCode === Koa.config.appHashCode) {
    let paymentSessionStatus = await sessionPaymentService.status(ctx);
    paymentSessionStatus.status = 'Complete';
    ctx.body = paymentSessionStatus;
  } else {
    throw {
			status: 401,
			message: {
				code: 'AuthError',
				msg: 'Access denied'
			}
		};
  } 
}

module.exports = {
  create: create,
  getStatus: getStatus
};