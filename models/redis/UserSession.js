'use strict';
/* jshint strict: false, esversion: 6 */

let RedisService = require('../../config/redisDatasource');

function createUserSession(userSessionId, userSession, userSessionStatus) {
  let sessionData = {
    status: userSessionStatus,
    data: userSession
  }
	RedisService.setToRedis("userSession:" + userSessionId, sessionData, Koa.config.redisConf.expireUserSession);
}

function updateUserSession(userSessionId, userSession, userSessionStatus) {
	return new Promise((resolve, reject) => {
		RedisService.getFromRedis("userSession:" + userSessionId, (err, result) => {
			if (err) {
				reject(err);
			} else {
				result.status = userSessionStatus || result.status;
        result.data = userSession;
        RedisService.setToRedis("userSession:" + userSessionId, result, Koa.config.redisConf.expireUserSession);
				resolve(result);
			}
		});
	});
}

function getUserSession(userSessionId) {
	return new Promise((resolve, reject) => {
		RedisService.getFromRedis("userSession:" + userSessionId, (err, result) => {
			if (err) {
				reject(err);
			} else {
				resolve(result);
			}
		});
	});
}

module.exports = {
	createUserSession: createUserSession,
	updateUserSession: updateUserSession,
	getUserSession: getUserSession
};