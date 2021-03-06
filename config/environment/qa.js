/*jshint esversion: 6 */

module.exports = {
	appName: 'PAYMENTS-QA',
	paymentWappUrl: 'http://pagos-qa.cocha.com/:sessionid',
	appHashCode: process.env.PAYMENT_APP_CODE || 'C0CH4P4YM3NT.03c71e74f6bd1f32534d6289e44d7869',
	commerceCodes: {
		cocha: '597026016959'
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
			charges: 'https://mid-qa.cocha.com/payment/v1/sessions/:sessionId/charges/',
			sessions: 'https://mid-qa.cocha.com/payment/v1/sessions/:sessionId/'
		},
		itau: {
			validateRut: 'http://apicanjegencert.celmedia.cl/ValidaRutCanje',
			generateDynamicKey: 'http://apicanjegencert.celmedia.cl/GeneraClaveDinamica',
			checkDynamicKey: 'http://apicanjegencert.celmedia.cl/CompruebaClaveDinamica/:rut/:dv/:providerId/:dynamicKey/:dynamicKeyId',
			validateSessionFlow: 'http://apicanjegencert.celmedia.cl/ValidarFlujoCliente/:rut/:dv/:providerId/:dynamicKeyId/:dynamicKey/:walletId/:pageNumber/:allowReload',
			requestPreExchange: 'http://apicanjegencert.celmedia.cl/SolicitarPrecanje',
			validateClient: 'http://apicanjegencert.celmedia.cl/ValidarStatusCliente/:rut/:dv/:providerId/:dynamicKeyId',
			requestExchange: 'http://apicanjegencert.celmedia.cl/RealizarCanje',
			cancelPreExchange: 'http://apicanjegencert.celmedia.cl/AnularPrecanje/:rut/:dv/:providerId/:preExchangeId/:productId/:productQuantity',
			listAccounts: 'http://apicanjegencert.celmedia.cl/ListarCuentas/:rut/:dv/:providerId/:dynamicKeyId/',
			selectAccount: 'http://apicanjegencert.celmedia.cl/SeleccionaCuenta/:rut/:dv/:providerId/:dynamicKeyId/:accountId/',
		},
		webpay: {
			setPayment: './resources/onlinePayWS-desa.wsdl', // 'http://192.168.254.65:8080/process/onlinePayWS?wsdl',
			getPaymentStatus: './resources/getPayStatusWS-desa.wsdl', //'http://192.168.254.65:8080/process/getPayStatusWS?wsdl',
			processPayment: 'http://www1-desa.cocha.com/Boton_Pago_PP/onlinePay.asp?token=:token'
		},
		erp: {
			redeem: './resources/canjeServiceWS-desa.wsdl' // 'http://192.168.254.65:8080/process/canjeServiceWS?wsdl'
		},
		confirmation: {
			reportPay: 'https://mid-qa.cocha.com/confirmation/v1/reportPay/:paymentSessionCode'
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
		enabled: false
	},
	redisConf: {
		host: process.env.REDIS_HOST || '127.0.0.1',
		port: parseInt(process.env.REDIS_PORT) || 6379,
		db: parseInt(process.env.REDIS_DB) || 0,
		expire: 60 * 60 * 24, // Seconds -> 24h
		expireAttemptSession: 60 * 5, // Seconds -> 5m
		expirePaymentSession: 60 * 60, // Seconds -> 1h
		expireUserSession: 60 * 25 // Seconds -> 25m
	},
	mysqlConf: {
		host: process.env.MYSQL_HOST || '192.168.254.170',
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
