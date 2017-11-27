'use strict';

var glob = require('glob')
var util = require('util')
var mongoose = require('mongoose');

mongoose.Promise = global.Promise;

var middleware = module.exports = options => {
    mongoose = options.mongoose ? options.mongoose : mongoose

    //mode: model
    var db = mongoose.connection
    middleware.models = {}
    middleware.dbs = {}
    if (options.schemas) {
        //mode: schema
        db = mongoose.createConnection()
        var schemas = options.schemas + (options.schemas.lastIndexOf('/') === (options.schemas.length - 1) ? '' : '/')
        var files = glob.sync(schemas + '/**/*.js')

        files.map(file => {
            var model = file
            .replace(schemas, '')
            .replace(/\.js$/g, '')
            .replace(/\//g, '.')
            .toLowerCase()
            var schema = require('.'+file)
            middleware.models[model] = db.model(model, schema)
        })
    }
    middleware.open(db, options)
    return  async (ctx, next) => {
        var database = typeof options.database === 'function' ? options.database(ctx) : options.database        

        if (!middleware.dbs.hasOwnProperty(database)) {
            middleware.dbs[database] = db.useDb(database)
        }
        ctx.model = model => {
            try {
                return middleware.model(database, model)
            } catch(err) {
                ctx.throw(400, err.message)
            }
        }
        ctx.document = (model, document) => new (ctx.model(model))(document)
        await next()
    }
}

middleware.model = (database, model) => {
    console.log("database",database); 
    console.log("model",model); 
    //var name = model.toLowerCase();
    var name = 'payment';
    if (!middleware.models.hasOwnProperty(name)) {
        throw new Error(util.format('Model not found: %s.%s', database, model))
    }
    return middleware.dbs[database].model(model, middleware.models[name].schema)
}

middleware.config = {
    username: (Koa.config.mongoConf.username ? Koa.config.mongoConf.username : ''),
    password: (Koa.config.mongoConf.password ? Koa.config.mongoConf.username : ''),
    host: Koa.config.mongoConf.host,
    port: Koa.config.mongoConf.port,
    database: Koa.config.mongoConf.database,
    schemas: './models/mongo/schemas',
    db: {
        native_parser: true
    },
    server: {
       poolSize: 5
    }
};

middleware.document = (database, model, document) => new (middleware.model(database, model))(document)

middleware.mongoose = mongoose

middleware.open = (db, options) => {
    if (!options || !options.host || !options.port) {
        throw new Error('options not found')
    }

    var database = typeof options.database === 'function' ? undefined : options.database

    db.on('error', err => {
        db.close();
    });

    console.log("OPEN",options.host, database, options.port, options);

    db.open(options.host, database, options.port, options)

    return db;
}