'use strict';
/* jshint strict: false, esversion: 6 */

const soap = require('soap');

const clients = {};

async function getClient(_url) {
  if (clients[_url]) {
		return clients[_url];
	} else {
    clients[_url] = await new Promise((resolve, reject) => {
      soap.createClient(_url, (err, client) => {
        if (err) {
          reject(err);
        } else {
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
    client[_method](_params, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
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