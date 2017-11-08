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
    rut: '5711401',
    dv: '0',
    proveedor_id: Koa.config.security.itau.providerId,
  };

  let data = await new Promise((resolve, reject) => {
    webServices.post('payment', url, params, header, (err, result) => {
      err = getErrorByType((err)? err.data.msg.meta : {code: result.response.COD_RESPUESTA, message: result.response.MSJ_RESPUESTA});
      if (err) {
        reject(err);
      } else {
        resolve(result);
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
    rut: '5711401',
    dv: '0',
    proveedor_id: Koa.config.security.itau.providerId,
    telefono: '5698440xxxx',
    email: ''
  };
  let data = await new Promise((resolve, reject) => {
    webServices.post('payment', url, params, header, (err, result) => {
      //console.log("AKIIIIL===>", err, result.meta, result.response);
      console.log("AKIIIIL===>", result.response);
      if (err) {
        err = getErrorByType(err.data.msg.meta);
        reject(err);
      } else {
        resolve(result);
      }
    }, _ctx.authSession);
  });
}

module.exports = {
  validateRut: validateRut,
  generateDynamicKey: generateDynamicKey
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