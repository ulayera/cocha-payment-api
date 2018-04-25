'use strict';
/* jshint strict: false, esversion: 6 */

module.exports = {
  "POST /methods/itau/sessions/:sessionId/get-token/": {
    controller: 'ItauController',
    action: 'attemptLogin',
  },
  "POST /methods/itau/sessions/:sessionId/send-token/": {
    controller: 'ItauController',
    action: 'getBalance',
  },
  "POST /methods/itau/sessions/:sessionId/freeze-amount/": {
    controller: 'ItauController',
    action: 'freezeAmount',
  },
  "GET /methods/itau/sessions/:sessionId/webpay-charge/:webpayId": {
    controller: 'ItauController',
    action: 'checkPaymentAndRetry',
  },
};