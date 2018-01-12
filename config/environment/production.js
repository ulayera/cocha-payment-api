/*jshint esversion: 6 */

module.exports = {
	appName: 'PAYMENTS',
	paymentWappUrl: 'https://pagos.cocha.com/:sessionid',
	commerceCodes: {
		cocha: '597027395651'
	},
	states: {
		paid: 'PAGADO',
		closed: 'CERRADO',
		pending: 'PENDIENTE',
		failed: 'FALLO',
		erpPending: 'PENDIENTE-SMART',
		erpFail: 'FALLO-SMART'		
	},
	codes: {
		currency: {
			clp: 'CLP',
			usd: 'USD'
		},
		method: {
			webpay: 'WEBPAY',
			itau: 'ITAU'
		},
		type: {
			online: 'ONLINE',
			points: 'EXCHANGE',
			hostToHost: 'H2H'
		},
		processedFlag: {
			open:0,
			pending:1,
			closed:2
		}
	},
	path: {
		itau: {
			validateRut: 'http://apicanjegencert.celmedia.cl/ValidaRutCanje',
			generateDynamicKey: 'http://apicanjegencert.celmedia.cl/GeneraClaveDinamica',
			checkDynamicKey: 'http://apicanjegencert.celmedia.cl/CompruebaClaveDinamica/:rut/:dv/:providerId/:dynamicKey/:dynamicKeyId',
			validateSessionFlow: 'http://apicanjegencert.celmedia.cl/ValidarFlujoCliente/:rut/:dv/:providerId/:dynamicKeyId/:dynamicKey/:walletId/:pageNumber/:allowReload',
			requestPreExchange: 'http://apicanjegencert.celmedia.cl/SolicitarPrecanje',
			validateClient: 'http://apicanjegencert.celmedia.cl/ValidarStatusCliente/:rut/:dv/:providerId/:dynamicKeyId',
			requestExchange: 'http://apicanjegencert.celmedia.cl/RealizarCanje',
			cancelPreExchange: 'http://apicanjegencert.celmedia.cl/AnularPrecanje/:rut/:dv/:providerId/:preExchangeId/:productId/:productQuantity'
		},
		webpay: { //Buscar los wsdl y agregarlos a los recursos cuando esten en prod
			setPayment: './resources/onlinePayWS-prod.wsdl', // 'http://192.168.254.66:8080/process/onlinePayWS?wsdl',
			getPaymentStatus: './resources/getPayStatusWS-prod.wsdl', //'http://192.168.254.66:8080/process/getPayStatusWS?wsdl',
			processPayment: 'www1.cocha.com/Boton_Pago_PP/onlinePay.asp?token=:token'
		},
		erp: { //Buscar los wsdl y agregarlos a los recursos cuando esten en prod
			redeem: './resources/canjeServiceWS-prod.wsdl' // 'http://192.168.254.66:8080/process/canjeServiceWS?wsdl'
		},
		confirmation: {
			reportPay: 'https://booking-mid.cocha.com/v1/reportPay/:paymentSessionCode'
		}
	},
	security: {
		itau: {
			providerId: 1,
			apiKey: '$2y$10$qcSivIyzCm2g0u53WCk5Sug/h3wENYIRIxmuCcbOUq2k4nnLpnMz6',
			apiKeyUser: '$2y$10$cZcEXCkUQgQmb729sfnor.tA3rwPEwhLGmb2tEuJ3/UuHew1FdosO'
		}
	},
	log: {
		level: 'info',
		external: true
	},
	crons: {
		enabled: true
	},
	redisConf: {
		host: process.env.REDIS_HOST ||  'mid-redis.cocha.com',
		port: parseInt(process.env.REDIS_PORT) || 6379,
		db: parseInt(process.env.REDIS_DB) || 0,
		expire: 60 * 60 * 24, // Seconds -> 24h
		expireAttemptSession: 60 * 5, // Seconds -> 5m
		expirePaymentSession: 60 * 60, // Seconds -> 1h
		expireUserSession: 60 * 25 // Seconds -> 25m
	},
	mysqlConf: {
		host: process.env.MYSQL_HOST ||  '192.168.254.29',
		port: parseInt(process.env.MYSQL_PORT) || 3306,
		database: 'expackage',
		username: process.env.MYSQL_USER ||  'search-digital',
		password: process.env.MYSQL_PASS ||  'c0ch4.D1g1t4l',
		// insecureAuth: true
	},
	mongoConf: {
		host: process.env.MONGODB_HOST ||  'mongo-db-desa.cocha.com',
		port: parseInt(process.env.MONGODB_PORT) || 27017,
		database: process.env.MONGODB_DB || 'local',
		username: process.env.MONGODB_USER || 'payment',
		password: process.env.MONGODB_PASS || 'payment1234',
		ttlCron: 1200
	}
};
