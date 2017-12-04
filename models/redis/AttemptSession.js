'use strict';
/* jshint strict: false, esversion: 6 */

let RedisService = require('../../config/redisDatasource');

function setAttemptSession(attemptSessionId, attemptSession) {
  return new Promise((resolve, reject) => {
		RedisService.setToRedis("attemptSession:" + attemptSessionId, attemptSession, Koa.config.redisConf.expireAttemptSession, (err, result) => {
			if (err) {
        Koa.log.error(err);
				reject({
          msg: err.DETAIL,
          code: 'AttemptPaymentError'
        });
				reject(err);
			} else {
				resolve(result);
			}
		});
  });
}

function getAttemptSession(attemptSessionId) {
	return new Promise((resolve, reject) => {
		RedisService.getFromRedis("attemptSession:" + attemptSessionId, (err, result) => {
      if (err && err.CODE !== 'RD-404') {
        Koa.log.error(err);
				reject({
          msg: err.DETAIL,
          code: 'AttemptPaymentError'
        });
				reject(err);
			} else {
				resolve(result);
			}
		});
	});
}

function delAttemptSession(attemptSessionId) {
	return new Promise((resolve, reject) => {
		RedisService.delFromRedis("attemptSession:" + attemptSessionId, (err, result) => {
			if (err) {
				Koa.log.error('Error deleting from Redis. Result: ' + err);
			}
			resolve(result);
		});
	});
}

function existsAttemptSession(attemptSessionId) {
	return new Promise((resolve, reject) => {
		RedisService.existInRedis("attemptSession:" + attemptSessionId, (err, result) => {
			if (err) {
				Koa.log.error(err);
				reject({
          msg: err.DETAIL,
          code: 'AttemptPaymentError'
        });
				reject(err);
			} else {
				resolve(result);
			}
		});
	});
}

module.exports = {
	setAttemptSession: setAttemptSession,
	getAttemptSession: getAttemptSession,
	delAttemptSession: delAttemptSession,
	existsAttemptSession: existsAttemptSession
};