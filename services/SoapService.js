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
          client.on("response", function(body, response, eid) {
            if (requestSummary[eid]) {
              let LogObj = _.cloneDeep(requestSummary[eid]);
              delete requestSummary[eid];

              LogObj.resquest = response.request.body;
              LogObj.reeponse = response.body;
              Koa.log.info(JSON.stringify(LogObj));
            }
          });

          resolve(client);
        }
      });
    });
    return clients[_url];
	}
}

async function callService(_uriWdsl, _method, _params) {
  let client = await getClient(_uriWdsl);
  return new Promise((resolve, reject) => {
    let exchangeId = uuidv4();
    requestSummary[exchangeId] = {
      function: "SoapService:callService",
      method: _method,
      serviceUrl: _uriWdsl,
      params: _params
    };
    client[_method](_params, (err, result, raw) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
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

module.exports = {
  callService: callService,
  getDetails: getDetails
};