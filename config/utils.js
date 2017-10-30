'use strict';
/* jshint strict: false, esversion: 6 */

let os = require('os');
let redisService = require('./redisDatasource');

function checkSentinel(_sentinelId) {
  return new Promise((resolve, reject) => {
    redisService.existInRedis(_sentinelId, (err, exist) => {
      if (err) {
        resolve(false);
      } else {
        var _hotsName = os.hostname();
        if (exist) {
          validateSentinel(_sentinelId, _hotsName, rest => {resolve(rest);});
        } else {
          redisService.setToRedis(_sentinelId, _hotsName, 900);
          setTimeout(() => {
            validateSentinel(_sentinelId, _hotsName, rest => {resolve(rest);});
          }, 2000);
        }
      }
    });
  });
}

module.exports = {
	checkSentinel: checkSentinel
};

function validateSentinel(_sentinelId, _hotsName, _cb) {
	redisService.getFromRedis(_sentinelId, (err, sentinel) => {
		if (err) {
			_cb(false);
		} else
		if (_hotsName === sentinel) {
			_cb(true);
			redisService.delFromRedis(_sentinelId, (err, deleted) => {
				if (deleted) {
					Koa.log.debug('Sentinel: ' + _sentinelId + ' => Borrado exitoso');
				} else {
					Koa.log.error('Sentinel: ' + _sentinelId + ' => Borrado no exitoso');
				}
			});
		} else {
      _cb(false);
    }
	});
}