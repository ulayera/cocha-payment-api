'use strict';
/* jshint strict: false, esversion: 6 */

module.exports = {
  "POST /sessions": {
    controller: 'SessionsController',
    action: 'createSession',
  },
  "GET /sessions/:sessionId/status": {
    controller: 'SessionsController',
    action: 'checkStatus',
  },
  "GET /sessions/:sessionId/": {
    controller: 'SessionsController',
    action: 'getSession',
  },
  "GET /sessions/:sessionId/as-deal": {
    controller: 'SessionsController',
    action: 'getSessionAsDeal',
  },
  "POST /sessions/:sessionId/charges": {
    controller: 'ChargesController',
    action: 'createCharge',
  },
  "GET /sessions/:sessionId/charges/:chargeId": {
    controller: 'ChargesController',
    action: 'getCharge',
  },
};