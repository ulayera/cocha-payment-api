/**
 * RedisDatasource.js
 */

'use strict';
/* jshint strict: false, esversion: 6 */

var redisLib = require("redis");
var Redis = redisLib.createClient(Koa.config.redisConf);

Redis.on("error", function(err) {
	Koa.log.error('[ERROR][RedisModel][onError] - ' + err);
});

function setToRedis(key, value, expire) {
	var expTime = expire || Koa.config.redisConf.expire;
	
	Redis.set(key, JSON.stringify(value));
	if(expTime && (!expire || expire!=-1)){
		Redis.expire(key, expTime);
	}
}

function getFromRedisWithPattern(keyPattern, callback) {
	scanComplete(keyPattern, '0', [], function (err, replies) { 
		if (err) {
			callback({
				CODE: 'RD-500',
				KEY: keyPattern,
				DETAIL: err
			}, null);
		} else
		if (replies === null || replies.length === 0) {
			callback({
				CODE: 'RD-404',
				KEY: keyPattern,
				DETAIL: 'La llave no tiene valor asociado'
			}, null);
		} else {
			Redis.mget(replies, function (err, reply) {
				if (err) {
					callback({
						CODE: 'RD-500',
						KEY: keyPattern,
						DETAIL: err
					}, null);
				} else
				if (reply === null) {
					callback({
						CODE: 'RD-404',
						KEY: keyPattern,
						DETAIL: 'La llave no tiene valor asociado'
					}, null);
				} else
				if (reply) {
					for (var i = 0; i < reply.length; i++) {
						reply[i] = JSON.parse(reply[i]);
						
					}
					callback(null, {keys: replies, reply: reply});
				}
			});
		}
	});
}

function getFromRedis(key, callback) {
	Redis.get(key, function(err, reply) {
		if (err) {
			callback({
				CODE: 'RD-500',
				KEY: key,
				DETAIL: err
			}, null);
		} else
		if (reply === null) {
			callback({
				CODE: 'RD-404',
				KEY: key,
				DETAIL: 'La llave no tiene valor asociado'
			}, null);
		} else
		if (reply) {
			callback(null, JSON.parse(reply));
		}
	});
}

function keysFromRedis(keyPattern, callback) {
	Redis.keys(keyPattern, function(err, replies) {
		if (err) {
			callback({
				CODE: 'RD-500',
				KEY: keyPattern,
				DETAIL: err
			}, null);
		} else
		if (replies === null) {
			callback({
				CODE: 'RD-404',
				KEY: keyPattern,
				DETAIL: 'La llave no tiene valor asociado'
			}, null);
		} else
		if (replies) {
			callback(null, replies);
		}
	});
}

function delFromRedis(key, callback) {
	Redis.del(key, function(err, reply) {
		if (err) {
			callback({
				CODE: 'RD-500',
				KEY: key,
				DETAIL: err
			}, null);
		} else {
			callback(null, (reply > 0));
		}
	});
}

function existInRedis(key, callback) {
	Redis.exists(key, function(err, reply) {
		if (err) {
			callback({
				CODE: 'RD-500',
				KEY: key,
				DETAIL: err
			}, null);
		} else {
			callback(null, (reply > 0));
		}
	});
}

module.exports = {
	setToRedis: setToRedis,
	getFromRedisWithPattern: getFromRedisWithPattern,
	getFromRedis: getFromRedis,
	keysFromRedis: keysFromRedis,
	delFromRedis: delFromRedis,
	existInRedis: existInRedis
};

function scanComplete(_keyPattern, _cursor, _keys ,_callback) {
	Redis.scan(_cursor, 'MATCH', _keyPattern, 'COUNT', '1000', function (err, reply) {
		if(err){
			_callback(err);
		} else {
			_keys = _keys.concat(reply[1])
			if(reply[0] === '0'){
				_callback(null, _keys);;
			}else{
				scanComplete(_keyPattern, reply[0], _keys, _callback);
			}
		}
	});
}