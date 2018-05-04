/*jshint esversion: 6 */

module.exports = {
	appName: 'PAYMENTS',
	paymentWappUrl: 'https://pagos.cocha.com/:sessionid',
	appHashCode: process.env.PAYMENT_APP_CODE || 'C0CH4P4YM3NT.03c71e74f6bd1f32534d6289e44d7869',
	commerceCodes: {
		cocha: '597027395651'
	},
	productEmail: {
		flight: 'agenteinternet@cocha.com',
		flighthotel: 'agenteinternet@cocha.com'
	},
	states: {
		created: 'CREADO',
		pending: 'PENDING',
		paid: 'PAGADO',
		failed: 'FALLO',
		erpPending: 'PENDIENTE-SMART',
		erpFail: 'FALLO-SMART',
		closed: 'CLOSED',
		complete: 'COMPLETE'
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
			open: 0,
			pending: 1,
			closed: 2
		},
		source: {
			VyH: 'D',
			Vuelo: 'F',
			Hotel: 'H'
		}
	},
	path: {
		local: {
			charges: 'https://mid.cocha.com/payment/v1/sessions/:sessionId/charges/',
			sessions: 'https://mid.cocha.com/payment/v1/sessions/:sessionId/'
		},
		itau: {
			validateRut: 'http://itau20apicanje.clop.cl/ValidaRutCanje',
			generateDynamicKey: 'http://itau20apicanje.clop.cl/GeneraClaveDinamica',
			checkDynamicKey: 'http://itau20apicanje.clop.cl/CompruebaClaveDinamica/:rut/:dv/:providerId/:dynamicKey/:dynamicKeyId',
			validateSessionFlow: 'http://itau20apicanje.clop.cl/ValidarFlujoCliente/:rut/:dv/:providerId/:dynamicKeyId/:dynamicKey/:walletId/:pageNumber/:allowReload',
			requestPreExchange: 'http://itau20apicanje.clop.cl/SolicitarPrecanje',
			validateClient: 'http://itau20apicanje.clop.cl/ValidarStatusCliente/:rut/:dv/:providerId/:dynamicKeyId',
			requestExchange: 'http://itau20apicanje.clop.cl/RealizarCanje',
			cancelPreExchange: 'http://itau20apicanje.clop.cl/AnularPrecanje/:rut/:dv/:providerId/:preExchangeId/:productId/:productQuantity',
			listAccounts: 'http://itau20apicanje.clop.cl/ListarCuentas/:rut/:dv/:providerId/:dynamicKeyId/',
			selectAccount: 'http://itau20apicanje.clop.cl/SeleccionaCuenta/:rut/:dv/:providerId/:dynamicKeyId/:accountId/',
		},
		webpay: {
			setPayment: './resources/onlinePayWS-prod.wsdl', // 'http://192.168.254.66:8080/process/onlinePayWS?wsdl',
			getPaymentStatus: './resources/getPayStatusWS-prod.wsdl', //'http://192.168.254.66:8080/process/getPayStatusWS?wsdl',
			processPayment: 'https://www1.cocha.com/Boton_Pago_PP/onlinePay.asp?token=:token'
		},
		erp: { //Buscar los wsdl y agregarlos a los recursos cuando esten en prod
			redeem: './resources/canjeServiceWS-prod.wsdl' // 'http://192.168.254.66:8080/process/canjeServiceWS?wsdl'
		},
		confirmation: {
			reportPay: 'https://mid.cocha.com/confirmation/v1/reportPay/:paymentSessionCode'
		}
	},
	security: {
		itau: {
			providerId: 31,
			apiKey: '$2y$10$L2E1AYypB4J.mkKTSqXZbOS.wfmrsWXX3OAEkLEcJR2Kz3OT/tGs.',
			apiKeyUser: '$2y$10$bnJAORFOIQSAHpNQ0T0Q5.NTlcaQrGj0c0ve.e02TpONZHJwEt5k.'
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
		host: process.env.REDIS_HOST || 'mid-redis.cocha.com',
		port: parseInt(process.env.REDIS_PORT) || 6379,
		db: parseInt(process.env.REDIS_DB) || 0,
		expire: 60 * 60 * 24, // Seconds -> 24h
		expireAttemptSession: 60 * 5, // Seconds -> 5m
		expirePaymentSession: 60 * 60, // Seconds -> 1h
		expireUserSession: 60 * 25 // Seconds -> 25m
	},
	mysqlConf: {
		host: process.env.MYSQL_HOST || '192.168.254.29',
		port: parseInt(process.env.MYSQL_PORT) || 3306,
		database: 'expackage',
		username: process.env.MYSQL_USER || 'search-digital',
		password: process.env.MYSQL_PASS || 'c0ch4.D1g1t4l',
		// insecureAuth: true
	},
	mongoConf: {
		host: process.env.MONGODB_PAYMENT_HOST || 'mongo-db-desa.cocha.com',
		port: parseInt(process.env.MONGODB_PAYMENT_PORT) || 27017,
		database: process.env.MONGODB_PAYMENT_DB || 'payment',
		username: process.env.MONGODB_PAYMENT_USER || 'payment',
		password: process.env.MONGODB_PAYMENT_PASS || 'p4ym3nt',
		ttlCron: 1200
	}
};
