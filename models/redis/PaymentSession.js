'use strict';
/* jshint strict: false, esversion: 6 */

let RedisService = require('../../config/redisDatasource');

function setPaymentSession(paymentSessionId, paymentSession) {
  return new Promise((resolve, reject) => {
		RedisService.setToRedis("paymentSession:" + paymentSessionId, paymentSession, Koa.config.redisConf.expirePaymentSession, (err, result) => {
			if (err) {
        Koa.log.error(err);
				reject({
          msg: err.DETAIL,
          code: 'SessionPaymentError'
        });
			} else {
				resolve(result);
			}
		});
  });
}

function getPaymentSession(paymentSessionId) {
	return new Promise((resolve, reject) => {
		RedisService.getFromRedis("paymentSession:" + paymentSessionId, (err, result) => {
			if (err) {
        Koa.log.error(err);
				reject({
          msg: err.DETAIL,
          code: 'SessionPaymentError'
        });
			} else {
				resolve(result);
			}
		});
	});
}

function existsPaymentSession(paymentSessionId) {
	return new Promise((resolve, reject) => {
		RedisService.existInRedis("paymentSession:" + paymentSessionId, (err, result) => {
			if (err) {
        Koa.log.error(err);
				reject({
          msg: err.DETAIL,
          code: 'SessionPaymentError'
        });
			} else {
				resolve(result);
			}
		});
	});
}

module.exports = {
	setPaymentSession: setPaymentSession,
	getPaymentSession: getPaymentSession,
	existsPaymentSession: existsPaymentSession
};