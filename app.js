'use strict';
/*jshint esversion: 6 */

const PORT = process.env.PORT || 1337;
const ENV = process.env.NODE_ENV || 'production';
//const ENV = 'development';

global.Koa = {};
global.Koa.config = require('./config/environment/' + ENV);
global.Koa.log = require('./config/logger');

let authenticator = require('./config/authenticator');
let routes = require('./config/routes');
let crons = require('./config/crons');
let utils = require('./config/utils');

global.env = ENV;
global._ = require('lodash');
global.moment = require('moment');

let app = new (require('koa'))();
let router = new (require('koa-router'))();
let bodyParser = require('koa-bodyparser')();


let cronJob = require('cron').CronJob;

let redisService = require('./config/redisDatasource');
let mysqlService = require('./config/mysqlDatasource');
mysqlService.start(); //Init MySQL database access // Buscar una mejor manera

let mongoService = require('./config/mongoDatasource');
mongoService.start();


if (Koa.config.crons.enabled) {
	_.forEach(crons, (cron, key) => {			
		let action = (typeof cron.action === 'function')? cron.action : require('./services/' + cron.service)[cron.action];
		let job = new cronJob({
			cronTime: cron.time,
			onTick: async () => {
				try {
					if (await utils.checkSentinel(key)) {
						await action();
						Koa.log.debug('Cron Job: ' + key + ' => End'); 
					}
				} catch (error) {
					Koa.log.error('Cron Job: ' + key + ' => Error: ', error);
				}
			},
			start: false
		});
		job.start();
	});
}

_.forEach(routes, (route, key) => {
	router[route.method.toLowerCase()](key, async ctx => {
		let valid = true; 
		if (route.auth) {
			valid = await authenticator[route.auth.strategy](ctx.request.header, ctx.params);
			ctx.authType = valid && valid.type;
			ctx.authSession = (valid && valid.sessionData)? valid.sessionData : ctx.authSession;
		}

		if (valid) {
			let executable = require('./controllers/' + route.controller)[route.action];
			await executable(ctx);
		} else {
			if (route.auth.redirect) {
				ctx.redirect(route.auth.redirect);
			} else {
				throw {status: 401, message: {code: 'AuthError', msg: 'Access denied'}};
			}
		}
	});
});

app.use(bodyParser);

app.use(async (ctx, next) => {
	ctx.params = _.assign(ctx.params, ctx.request.query, ctx.request.body);
	ctx.authSession = {
		trackId: ctx.request.header.trackid,
		flowId: ctx.request.header.flowid
	};

	try {
		await next();
	} catch (err) {
		Koa.log.error(err);
		let message = err.message || err;
		let status = err.status || 500;

		Koa.log.errorSL({
			action: ctx.request.url,
			searchParams: ctx.params,
			status: status,
			message: message,
			data: err.data || err
		}, ctx.authSession);

		ctx.status = status;
		ctx.body = (_.isString(message))? {msg: message, code: 'UnknowError'} : message;
	}

	ctx.response.remove('Connection');
	ctx.response.set('Access-Control-Allow-Origin', '*');
	ctx.response.set('Access-Control-Allow-Headers', 'sid, TrackId, FlowId, Origin, X-Requested-With, Content-Type, Accept, Authorization, PaymentIntention');
	ctx.response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	ctx.response.set('Content-Type', 'application/json; charset=utf-8');
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(PORT, () => {
	Koa.log.info('Server running at');
	Koa.log.info('PORT: ' + PORT);
	Koa.log.info('ENV: ' + ENV);
});