'use strict';

var koaMongoose = require('koa-mongoose');
var mongoose = require('mongoose');

var mongooseConfig = {
    username: 'payment',
    password: 'payment1234',
    //username: 'dba',
    //password: 'yWigai9SQTlPE4ZpYFOctPROhtaeZHz1',    
    host: 'mongo-db-desa.cocha.com',
    port: Koa.config.mongoConf.port,
    database: 'local',
    auth:{
        authdb:"admin"
    },
    authdb:"admin",
    //auth:"admin",    
    /*
    username: (Koa.config.mongoConf.username ? Koa.config.mongoConf.username : ''),
    password: (Koa.config.mongoConf.password ? Koa.config.mongoConf.username : ''),
    host: Koa.config.mongoConf.host,
    port: Koa.config.mongoConf.port,
    database: Koa.config.mongoConf.database,
    */
    db: {
        native_parser: true
    },
    server: {
       poolSize: 5
    }
};



module.exports = {
	start:function(){
		//koaMongoose(mongooseConfig);			
        var promise = mongoose.connect('mongodb://payment:payment1234@mongo-db-desa.cocha.com:27017/local?authdb=admin', {
            useMongoClient: true,
            /* other options */
        });
	}
};