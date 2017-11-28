'use strict';

var koaMongoose = require('koa-mongoose');

var mongooseConfig = {
    username: (Koa.config.mongoConf.username ? Koa.config.mongoConf.username : ''),
    password: (Koa.config.mongoConf.password ? Koa.config.mongoConf.username : ''),
    host: Koa.config.mongoConf.host,
    port: Koa.config.mongoConf.port,
    database: Koa.config.mongoConf.database,
    //schemas: './models/mongo/schemas',
    db: {
        native_parser: true
    },
    server: {
       poolSize: 5
    }
};

module.exports = {
	start:function(){
		koaMongoose(mongooseConfig);			
	}
};