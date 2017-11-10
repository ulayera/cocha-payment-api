'use strict';
/* jshint strict: false, esversion: 6 */

const webServices = require('cocha-external-services').webServices;

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
	let data = await new Promise((resolve, reject) => {
		webServices.post('payment', url, params, header, (err, result) => {
			err = getErrorByType((err) ? err.data.msg.meta : {code: result.response.COD_RESPUESTA, message: result.response.MSJ_RESPUESTA});
			if (err) {
				reject(err);
			} else {
				resolve( {
          name: result.response.CLI_NOMBRE,
          rut: result.response.CLI_RUT,
          dv: result.response.CLI_DV,
          email: result.response.CLI_MAIL,
          phoneNumber: result.response.CLI_TELEFONO
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
	let data = await new Promise((resolve, reject) => {
		webServices.post('payment', url, params, header, (err, result) => {
			if (err) {
				err = getErrorByType(err.data.msg.meta);
				reject(err);
			} else {
				resolve({
          key: result.response.CLV_CODIGO,
          id: result.response.CLV_ID,
					status: result.response.CLV_ESTADO,
					attempts: +result.response.CLV_NUM_INTENTO,
          expiration: result.response.CLV_FCH_EXPIRA_CLAVE
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

	let data = await new Promise((resolve, reject) => {
		webServices.get('payment', url, params, header, (err, result) => {
			err = getErrorByType((err) ? err.data.msg.meta : {code: result.response.CLV_ESTADO, message: result.response.CLV_MENSAJE});
			if (err) {
				reject(err);
			} else {
				resolve({
					status: result.response.CLV_MENSAJE
        });
			}
		}, _ctx.authSession);
	});

	return data;
}

async function startSession(_ctx) {
  let url = Koa.config.path.itau.startSession;
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
  let data = await new Promise((resolve, reject) => {
    webServices.get('payment', url, params, header, (err, result) => {
        if (err) {
        err = getErrorByType(err.data.msg.meta);
        reject(err);
      } else {
        resolve({
	status: result.response.CLV_MENSAJE,
	expiration: result.response.CLV_FCH_EXPIRA_CLAVE,
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
  startSession: startSession
};

function getErrorByType(_meta) {
	let status = Number(_meta.code);
	let description;
	let code;
	if (status === 200 || status === 202) {
		return null;
	} else
	if (status === 150 || status === 151 || status === 152 || status === 153) {
		status = 400;
		description = _meta.message;
		code = 'ActionError';
	} else
	if (status === 400 || status === 401 || status === 404 || status === 405 || status === 429) {
		description = `Problema al procesar la peticion, Data: ${JSON.stringify(_meta)}`;
		code = 'ProcessError';
	} else {
		description = `Error interno, no es posible procesar la peticion, Data: ${JSON.stringify(_meta)}`;
		code = 'InternalError';
	}

	return {
		status: status,
		message: {
			code: code,
			msg: description
		},
		data: _meta
	};
}
