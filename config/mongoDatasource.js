'use strict';

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

module.exports = {
	start: function() {
		let mongoose = require('mongoose');
        mongoose.connect('mongodb://'
            + (Koa.config.mongoConf.username ? Koa.config.mongoConf.username + ':' + encodeURIComponent(Koa.config.mongoConf.password) : '') 
            + '@' + Koa.config.mongoConf.host + ':' + Koa.config.mongoConf.port
            + '/' + Koa.config.mongoConf.database
	          + '?authSource=admin', {
				useMongoClient: true
			});
	}
};
