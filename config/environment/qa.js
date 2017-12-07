/*jshint esversion: 6 */

module.exports = {
	appName: 'PAYMENTS-QA',
	commerceCode: '597026016959',
	states:{
		 paid:'PAGADO'
		,closed:'CERRADO'
		,pending:'PENDIENTE'
		,failed:'FALLO'
	},
	codes:{
		currency:{
			 clp:'CLP'
			,usd:'USD'
		},
		payment:{
			 webpay:'WEBPAY'
			,itau:'ITAU'
		}
	},	
	path: {
		itau:{
			validateRut: 'http://itau20apiprep.clop.cl/ValidaRutCanje',
			generateDynamicKey: 'http://itau20apiprep.clop.cl/GeneraClaveDinamica',
			checkDynamicKey: 'http://itau20apiprep.clop.cl/CompruebaClaveDinamica/:rut/:dv/:providerId/:dynamicKey/:dynamicKeyId',
			startSession: 'http://itau20apiprep.clop.cl/InicioSesion/:rut/:dv/:providerId/:dynamicKeyId',
			validateSessionFlow: 'http://itau20apiprep.clop.cl/ValidarFlujoCliente/:rut/:dv/:providerId/:dynamicKeyId/:dynamicKey/:pageNumber',			
			requestPreExchange: 'http://itau20apiprep.clop.cl/SolicitarPrecanje',
			validateClient: 'http://itau20apiprep.clop.cl/ValidarStatusCliente/:rut/:dv/:providerId/:dynamicKeyId',
			requestExchange: 'http://itau20apiprep.clop.cl/RealizarCanje',
			cancelPreExchange: 'http://itau20apiprep.clop.cl/AnularPrecanje/:rut/:dv/:providerId/:preExchangeId/:productId'
		},
		webpay: {
			setPayment: './resources/onlinePayWS-desa.wsdl', // 'http://192.168.254.65:8080/process/onlinePayWS?wsdl',
			getPaymentStatus: './resources/getPayStatusWS-desa.wsdl', //'http://192.168.254.65:8080/process/getPayStatusWS?wsdl',
			processPayment: 'www1-desa.cocha.com/Boton_Pago_PP/onlinePay.asp?token=:token'
		},
		erp:{
			redeem: './resources/canjeServiceWS-desa.wsdl' // 'http://192.168.254.65:8080/process/canjeServiceWS?wsdl'
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
		enabled: false
	},
	redisConf: {
		host: process.env.REDIS_HOST || '127.0.0.1',
		port: parseInt(process.env.REDIS_PORT) || 6379,
		db: parseInt(process.env.REDIS_DB) || 0,
		expire: 60 * 60 * 24, // Seconds -> 24h
		expireAttemptSession: 60 * 5, // Seconds -> 5m
		expirePaymentSession: 60 * 60, // Seconds -> 1h
		expireUserSession: 60 * 25 // Seconds -> 25m
	},
	mysqlConf: {
		host: process.env.MYSQL_HOST || '192.168.254.170',
		port: parseInt(process.env.MYSQL_PORT) || 3306,
		database: 'expackage',
		username: process.env.MYSQL_USER || 'search-digital',
		password: process.env.MYSQL_PASS || 'c0ch4.D1g1t4l',
		// insecureAuth: true
	},
	mongoConf: {
		host: process.env.MONGODB_HOST || 'mongo-db-desa.cocha.com',
		port: parseInt(process.env.MONGODB_PORT) || 27017,
		database: process.env.MONGODB_DB || 'local',
		username: process.env.MONGODB_USER || 'payment',
		password: process.env.MONGODB_PASS || 'payment1234',
		ttlCron:1200
	}
};