'use strict';
/* jshint strict: false, esversion: 6 */

const soap = require('soap');
const uuidv4 = require('uuid/v4');

const clients = {};
const requestSummary = {};

async function getClient(_url) {
  if (clients[_url]) {
		return clients[_url];
	} else {
    clients[_url] = await new Promise((resolve, reject) => {
      soap.createClient(_url, (err, client) => {
        if (err) {
          reject(err);
        } else {
          client.on("request", function(request, eid) {
            requestSummary[eid].requestBody = request;
          });

          client.on("response", function(body, response, eid) {
            if (response) {
              requestSummary[eid].responseHeader = response.headers;
            }
          });

          resolve(client);
        }
      });
    });
    return clients[_url];
	}
}

async function callService(_uriWdsl, _method, _params, _extraData) {
  let client = await getClient(_uriWdsl);
  return new Promise((resolve, reject) => {
    const exchangeId = uuidv4();
    requestSummary[exchangeId] = {};
     
    const logFunction = _extraData.logFunction || null;
    delete _extraData.logFunction;

    let logObj = buildLogObj('SOAP', _uriWdsl, _params, _extraData)
    const startTime = Date.now();
    client[_method](_params, (err, result, response) => {
      try {
        logObj.params = requestSummary[exchangeId].requestBody;
        if (err) {
          logObj.success = false;
          logObj.level = 'error';
          if (err.response) {
            logObj.remoteServer = getResponseServer(err.response.headers);   
            logObj.msg = "Response statuscode != 200";
            logObj.data = {name: 'StatusCodeError', statusCode: err.response.statusCode, msg: err.response.body || err.response.statusMessage};
            reject({msg: logObj.msg, data: {name: 'StatusCodeError', statusCode: err.response.statusCode, msg: err.body || err.response.statusMessage}}); //Verificar cuando se pueda (no puedo hacer pruebas mas complejas) si "err.body" es igual a "err.response.body" 
          } else {
            logObj.msg = "Request/Response failed";
            logObj.data = {name: 'RequestError', message: String(err), cause: err};
            reject(logObj);
          }
        } else {
          logObj.remoteServer = getResponseServer(requestSummary[exchangeId].responseHeader);          
          logObj.msg = "Got correct response";
          logObj.data = response;
          resolve(result);
        }
      } finally {
        delete requestSummary[exchangeId];
        logObj.responseTime = Date.now() - startTime;
        if (logFunction) {
          logFunction(logObj, () => {
            Koa.log.info(JSON.stringify(logObj));
          });
        } else
        if (!logLevel || logObj.level === logLevel) {
          Koa.log.info(JSON.stringify(logObj));
        }
      }
    }, {exchangeId: exchangeId});
  });	
}

async function getDetails(_uriWdsl, _method) {
  let client = await getClient(_uriWdsl);
  let description = client.describe();
  if (_method) {
    for(let service in description) {
      for(let port in description[service]) {
        if (description[service][port][_method]) {
          return description[service][port][_method];
        }
      }
    }
  }
  return description;
}

function buildLogObj(_method, _serviceUrl, _params, _extraData) {
  let extraData = _.cloneDeep(_extraData);
  const flowId = extraData ? extraData.flowId || null : null;
  const trackId = extraData ? extraData.trackId || null : null;
  const serviceContext = extraData ? extraData.serviceContext || null : null;
  const serviceName = extraData ? extraData.serviceName || null : null;
  delete extraData.flowId;
  delete extraData.trackId;
  delete extraData.serviceContext;
  delete extraData.serviceName;

  return {
      function: "SoapService:callService",
      method: _method,
      trackId: trackId,
      flowId: flowId,
      sessionData: extraData,
      serviceContext: serviceContext,
      serviceName: serviceName,
      serviceUrl: _serviceUrl,
      params: _params,
      success: true,
      level: 'info',
      dataSource: 'request',
  };
}

function getResponseServer(_headers = {}) {
  if (_headers['x-server-name']) {
      return _headers['x-server-name'];
  }
  if (_headers['x-server']) {
      return _headers['x-server'];
  }
  if (_headers.server) {
      return _headers.server;
  }
  return "None given";
}

module.exports = {
  callService: callService,
  getDetails: getDetails
};