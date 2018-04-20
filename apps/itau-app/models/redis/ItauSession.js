'use strict';
/* jshint strict: false, esversion: 6 */

let RedisService = require('../../../../config/redisDatasource');

function createItauSession(rut, data) {
  RedisService.setToRedis("itauSession:" + rut, data, Koa.config.redisConf.expireUserSession);
}

function updateItauSession(rut, data) {
  return new Promise((resolve, reject) => {
    RedisService.getFromRedis("itauSession:" + rut, (err, result) => {
      if (err) {
        reject(err);
      } else {
        RedisService.setToRedis("itauSession:" + rut, data, Koa.config.redisConf.expireUserSession);
        resolve(data);
      }
    });
  });
}

function getItauSession(rut) {
  return new Promise((resolve, reject) => {
    RedisService.getFromRedis("itauSession:" + rut, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

module.exports = {
  createItauSession: createItauSession,
  updateItauSession: updateItauSession,
  getItauSession: getItauSession,
};