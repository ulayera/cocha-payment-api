'use strict';

var mongoose = require('mongoose');

module.exports = {
	start:function(){
        let mongoose = require('mongoose');		
        mongoose.connect('mongodb://'+(Koa.config.mongoConf.username ? Koa.config.mongoConf.username+':'+Koa.config.mongoConf.password : '')+'@'+Koa.config.mongoConf.host+':'+Koa.config.mongoConf.port+'/'+Koa.config.mongoConf.database+'?authSource=admin', {
            useMongoClient: true
        });
	}
};