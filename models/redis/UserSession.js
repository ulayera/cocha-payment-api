'use strict';
/* jshint strict: false, esversion: 6 */

let RedisService = require('../../config/redisDatasource');

function createUserSession(userSessionId, userSession, userSessionStatus) {
  let sessionData = {
    status: userSessionStatus,
    data: userSession
  }
	RedisService.setToRedis("userSession:" + userSessionId, sessionData, Koa.config.redisConf.expireDelta);
}

function updateUserSession(userSessionId, userSession) {
	return new Promise((resolve, reject) => {
		RedisService.getFromRedis("userSession:" + userSessionId, (err, result) => {
			if (err) {
				reject(err);
			} else {
        result.data = userSession;
        RedisService.setToRedis("userSession:" + userSessionId, result, Koa.config.redisConf.expireDelta);
				resolve(result);
			}
		});
	});
}

function changeUserSessionStatus(userSessionId, userSessionStatus) {
	return new Promise((resolve, reject) => {
		RedisService.getFromRedis("userSession:" + userSessionId, (err, result) => {
			if (err) {
				reject(err);
			} else {
        result.status = userSessionStatus;
        RedisService.setToRedis("userSession:" + userSessionId, result, Koa.config.redisConf.expireDelta);
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
	changeUserSessionStatus: changeUserSessionStatus,
	getUserSession: getUserSession
};