'use strict';
/* jshint strict: false, esversion: 6 */

const webServices = require('cocha-external-services').webServices;
const logService = require('./LogService');

async function validateRut(_ctx) {
	let url = Koa.config.path.itau.validateRut;
	let header = {
		'api-key': Koa.config.security.itau.apiKey,
		'api-key-user': Koa.config.security.itau.apiKeyUser
	};
	let params = {
		rut: _ctx.params.rut,
		dv: _ctx.params.dv,
		proveedor_id: Koa.config.security.itau.providerId,
	};
	_ctx.authSession.logFunction = logService.logCallToService;
	let data = await new Promise((resolve, reject) => {
		webServices.post('payment', url, params, header, (err, result) => {
			let status;
			let message;
			if (err) {
				status = Number(err.response.meta.code);
				message = err.response.meta.message;				
			} else {
				status = Number(result.response.COD_RESPUESTA || result.meta.code);
				message = result.response.MSJ_RESPUESTA || result.meta.message;
			}

			if (status === 200 || status === 202) {
				resolve({
					rut: result.response.CLI_RUT,
					dv: result.response.CLI_DV,
          name: result.response.CLI_NOMBRE,
          firstLastName: result.response.CLI_PATERNO,
          secondLastName: result.response.CLI_MATERNO,
          email: result.response.CLI_MAIL,
					phoneNumber: result.response.CLI_TELEFONO,
					segmentId: result.response.CLI_SEGMENTO_ID,
					segmentName: result.response.CLI_SEGMENTO_NMB
        });
			} else {
				let code, description;
				if (status > 99 && status < 200) {
					description = `The rut is not valid, Data: ${status} - ${message}`;
					code = 'ValidateRutError-' + status;
					status = 400;					
				} else
				if (status > 399 && status < 500) {
					description = `Problem processing the request, Data: ${status} - ${message}`;
					code = 'ValidateRutProcessError';
				} else {
					description = `Internal error, it is not possible to process the request, Data: ${status} - ${message}`;
					code = 'InternalError';
				}
			
				reject({
					status: status,
					message: {
						code: code,
						msg: description
					}
				});
			}
		}, _ctx.authSession);
	});

	return data;
}

async function generateDynamicKey(_ctx) {
	let url = Koa.config.path.itau.generateDynamicKey;
	let header = {
		'api-key': Koa.config.security.itau.apiKey,
		'api-key-user': Koa.config.security.itau.apiKeyUser
	};
	let params = {
		rut: _ctx.params.rut,
		dv: _ctx.params.dv,
		proveedor_id: Koa.config.security.itau.providerId,
		telefono: _ctx.params.phoneNumber,
		email: _ctx.params.email,
	};
	_ctx.authSession.logFunction = logService.logCallToService;
	let data = await new Promise((resolve, reject) => {
		webServices.post('payment', url, params, header, (err, result) => {
			let status;
			let message;
			if (err) {
				status = Number(err.response.meta.code);
				message = err.response.meta.message;				
			} else {
				status = Number(result.response.COD_RESPUESTA || result.meta.code);
				message = result.response.MSJ_RESPUESTA || result.meta.message;
			}

			if (status === 200 || status === 202) {
				resolve({
					key: result.response.CLV_CODIGO,
          id: result.response.CLV_ID,
					generationStatus: result.response.CLV_ESTADO,
					attempts: +result.response.CLV_NUM_INTENTO,
          expiration: result.response.CLV_FCH_EXPIRA_CLAVE
        });
			} else {
				let code, description;
				if (status > 399 && status < 500) {
					description = `Problem processing the request, Data: ${status} - ${message}`;
					code = 'SendKeyProcessError';
				} else {
					description = `Internal error, it is not possible to process the request, Data: ${status} - ${message}`;
					code = 'InternalError';
				}
			
				reject({
					status: status,
					message: {
						code: code,
						msg: description
					}
				});
			}
		}, _ctx.authSession);
	});

	return data;
}

async function checkDynamicKey(_ctx) {
	let url = Koa.config.path.itau.checkDynamicKey;
	let header = {
		'api-key': Koa.config.security.itau.apiKey,
		'api-key-user': Koa.config.security.itau.apiKeyUser
	};
	let params = {
		rut: _ctx.params.rut,
		dv: _ctx.params.dv, 
		providerId: Koa.config.security.itau.providerId,
		dynamicKey: _ctx.params.dynamicKey,
		dynamicKeyId: _ctx.params.dynamicKeyId
	};
	_ctx.authSession.logFunction = logService.logCallToService;
	let data = await new Promise((resolve, reject) => {
		webServices.get('payment', url, params, header, (err, result) => {
			let status;
			let message;
			if (err) {
				status = Number(err.response.meta.code);
				message = err.response.meta.message;				
			} else {
				status = Number(result.response.CLV_ESTADO || result.meta.code);
				message = result.response.CLV_MENSAJE || result.meta.message;
			}

			if (status === 200 || status === 202) {
				resolve({
					status: result.response.CLV_MENSAJE,
					sessionExpiration: result.response.CLV_FCH_EXPIRA_SESION
        });
			} else {
				let code, description;
				if (status > 99 && status < 200) {
					description = `The dinamic key is not valid, Data: ${status} - ${message}`;
					code = 'CheckKeyError-' + status;
					status = 400;					
				} else
				if (status > 399 && status < 500) {
					description = `Problem processing the request, Data: ${status} - ${message}`;
					code = 'CheckKeyProcessError';
				} else {
					description = `Internal error, it is not possible to process the request, Data: ${status} - ${message}`;
					code = 'InternalError';
				}
			
				reject({
					status: status,
					message: {
						code: code,
						msg: description
					}
				});
			}
		}, _ctx.authSession);
	});

	return data;
}

async function validateSessionFlow(_ctx) {
	let url = Koa.config.path.itau.validateSessionFlow;
	let header = {
		'api-key': Koa.config.security.itau.apiKey,
		'api-key-user': Koa.config.security.itau.apiKeyUser
	};
	let params = {
		rut: _ctx.params.rut,
		dv: _ctx.params.dv, 
		providerId: Koa.config.security.itau.providerId,
		dynamicKeyId: _ctx.params.dynamicKeyId,		
		dynamicKey: _ctx.params.dynamicKey,
		walletId: '0',
		pageNumber: '1',
		allowReload: '1'
	};
	_ctx.authSession.logFunction = logService.logCallToService;
	let data = await new Promise((resolve, reject) => {
		webServices.get('payment', url, params, header, (err, result) => {
			let status;
			let message;
			if (err) {
				status = Number(err.response.meta.code);
				message = err.response.meta.message;				
			} else {
				status = Number(result.response.COD_RESPUESTA || result.meta.code);
				message = result.response.MSJ_RESPUESTA || result.meta.message;
			}

			if (status === 200 || status === 202) {
				resolve({
					rut: result.response.CLI_RUT,
          dv: result.response.CLI_DV,
					phoneNumber: result.response.CLI_TELEFONO,
					email: result.response.CLI_MAIL,
					availablePoints: +result.response.CLI_SALDO_DISPONIBLE,
					availableAmount: +result.response.CLI_SALDO_CONVERSION,
					typeAmount: result.response.CLI_TIPO_CONVERSION
        });
			} else {
				let code, description;
				if (status > 99 && status < 200) {
					description = `Problem in the validation of the client session, Data: ${status} - ${message}`;
					code = 'ValidateSessionError-' + status;
					status = 400;					
				} else
				if (status > 399 && status < 500) {
					description = `Problem processing the request, Data: ${status} - ${message}`;
					code = 'ValidateSessionProcessError';
				} else {
					description = `Internal error, it is not possible to process the request, Data: ${status} - ${message}`;
					code = 'InternalError';
				}
			
				reject({
					status: status,
					message: {
						code: code,
						msg: description
					}
				});
			}
		}, _ctx.authSession);
	});

	return data;
}

async function requestPreExchange(_ctx) {
	let url = Koa.config.path.itau.requestPreExchange;
	let header = {
		'api-key': Koa.config.security.itau.apiKey,
		'api-key-user': Koa.config.security.itau.apiKeyUser
	};
	let params = {
		rut: _ctx.params.rut,
		dv: _ctx.params.dv,
		proveedor_id: Koa.config.security.itau.providerId,
		clave_id_generado: _ctx.params.dynamicKeyId,
		valor_producto: _ctx.params.spendingAmount,
		producto_id: _ctx.params.productId,
		cuenta_id: '0',
		cantidad_producto: 1
	};
	_ctx.authSession.logFunction = logService.logCallToService;
	let data = await new Promise((resolve, reject) => {
		webServices.post('payment', url, params, header, (err, result) => {
			let status;
			let message;
			if (err) {
				status = Number(err.response.meta.code);
				message = err.response.meta.message;				
			} else {
				status = Number(result.response.PRECANJE_ESTADO || result.meta.code);
				message = result.response.PRECANJE_MENSAJE || result.meta.message;
			}

			if (status === 200 || status === 202) {
				resolve({
					status: result.response.PRECANJE_MENSAJE,
					id: result.response.PRECANJE_ID,
					availableAmount: +result.response.PRECANJE_SALDO_CONVERSION,
					spentAmount: +result.response.PRECANJE_RESERVADO_CONVERSION
        });
			} else {
				let code, description;
				if (status > 99 && status < 200) {
					description = `It was not possible to make the exchange, Data: ${status} - ${message}`;
					code = 'PreExchangeError-' + status;
					status = 400;					
				} else
				if (status > 399 && status < 500) {
					description = `Problem processing the request, Data: ${status} - ${message}`;
					code = 'PreExchangeProcessError';
				} else {
					description = `Internal error, it is not possible to process the request, Data: ${status} - ${message}`;
					code = 'InternalError';
				}
			
				reject({
					status: status,
					message: {
						code: code,
						msg: description
					}
				});
			}
		}, _ctx.authSession);
	});

	return data;
}

async function validateClient(_ctx) {
	let url = Koa.config.path.itau.validateClient;
	let header = {
		'api-key': Koa.config.security.itau.apiKey,
		'api-key-user': Koa.config.security.itau.apiKeyUser
	};
	let params = {
		rut: _ctx.params.rut,
		dv: _ctx.params.dv, 
		providerId: Koa.config.security.itau.providerId,
		dynamicKeyId: _ctx.params.dynamicKeyId
	};
	_ctx.authSession.logFunction = logService.logCallToService;
	let data = await new Promise((resolve, reject) => {
		webServices.get('payment', url, params, header, (err, result) => {
			let status;
			let message;
			if (err) {
				status = Number(err.response.meta.code);
				message = err.response.meta.message;				
			} else {
				status = Number(result.response.CLI_ESTADO || result.meta.code);
				message = result.response.CLI_MENSAJE || result.meta.message;
			}

			if (status === 200 || status === 202) {
				resolve({
					status: result.response.CLI_MENSAJE
        });
			} else {
				let code, description;
				if (status > 99 && status < 200) {
					description = `Problem in the validation of the client, Data: ${status} - ${message}`;
					code = 'ValidateClientError-' + status;
					status = 400;					
				} else
				if (status > 399 && status < 500) {
					description = `Problem processing the request, Data: ${status} - ${message}`;
					code = 'ValidateClientProcessError';
				} else {
					description = `Internal error, it is not possible to process the request, Data: ${status} - ${message}`;
					code = 'InternalError';
				}
			
				reject({
					status: status,
					message: {
						code: code,
						msg: description
					}
				});
			}
		}, _ctx.authSession);
	});

	return data;
}

async function requestExchange(_ctx) {
	let url = Koa.config.path.itau.requestExchange;
	let header = {
		'api-key': Koa.config.security.itau.apiKey,
		'api-key-user': Koa.config.security.itau.apiKeyUser
	};
	let params = {
		rut: _ctx.params.rut,
		dv: _ctx.params.dv,
		proveedor_id: Koa.config.security.itau.providerId,
		precanje_id: _ctx.params.preExchangeId,
		conversion_utilizados: _ctx.params.spendingAmount,
		copago: _ctx.params.extraExchangeAmount,
		glosa_canje: _ctx.params.productName,
		orden_compra: _ctx.params.productId
	};
	_ctx.authSession.logFunction = logService.logCallToService;
	let data = await new Promise((resolve, reject) => {
		webServices.post('payment', url, params, header, (err, result) => {
			let status;
			let message;
			if (err) {
				status = Number(err.response.meta.code);
				message = err.response.meta.message;				
			} else {
				status = Number(result.response.CNJ_ESTADO || result.meta.code);
				message = result.response.CNJ_MENSAJE || result.meta.message;
			}

			if (status === 200 || status === 202) {
				resolve({
					status: result.response.CNJ_MENSAJE,
					id: result.response.CNJ_ID,
					generated: result.response.CNJ_FECHA
        });
			} else {
				let code, description;
				if (status > 399 && status < 500) {
					description = `Problem processing the request, Data: ${status} - ${message}`;
					code = 'ExchangeProcessError';
				} else {
					description = `Internal error, it is not possible to process the request, Data: ${status} - ${message}`;
					code = 'InternalError';
				}
			
				reject({
					status: status,
					message: {
						code: code,
						msg: description
					}
				});
			}
		}, _ctx.authSession);
	});

	return data;
}

async function cancelPreExchange(_ctx) {
	let url = Koa.config.path.itau.cancelPreExchange;
	let header = {
		'api-key': Koa.config.security.itau.apiKey,
		'api-key-user': Koa.config.security.itau.apiKeyUser
	};
	let params = {
		rut: _ctx.params.rut,
		dv: _ctx.params.dv, 
		providerId: Koa.config.security.itau.providerId,
		preExchangeId: _ctx.params.preExchangeId,
		productId: 0,
		productQuantity: 1
	};
	_ctx.authSession.logFunction = logService.logCallToService;
	let data = await new Promise((resolve, reject) => {
		webServices.get('payment', url, params, header, (err, result) => {
			let status;
			let message;
			if (err) {
				status = Number(err.response.meta.code);
				message = err.response.meta.message;				
			} else {
				status = Number(result.response.CNJ_ESTADO || result.meta.code);
				message = result.response.CNJ_MENSAJE || result.meta.message;
			}

			if (status === 200 || status === 202) {
				resolve({
					status: result.response.CNJ_MENSAJE
        });
			} else {
				let code, description;
				if (status > 399 && status < 500) {
					description = `Problem processing the request, Data: ${status} - ${message}`;
					code = 'CancelPreExchangeProcessError';
				} else {
					description = `Internal error, it is not possible to process the request, Data: ${status} - ${message}`;
					code = 'InternalError';
				}
			
				reject({
					status: status,
					message: {
						code: code,
						msg: description
					}
				});
			}
		}, _ctx.authSession);
	});

	return data;
}

module.exports = {
	validateRut: validateRut,
	generateDynamicKey: generateDynamicKey,
  checkDynamicKey: checkDynamicKey,
	validateSessionFlow: validateSessionFlow,
	requestPreExchange: requestPreExchange,
	validateClient: validateClient,
	requestExchange: requestExchange,
	cancelPreExchange:cancelPreExchange
};

