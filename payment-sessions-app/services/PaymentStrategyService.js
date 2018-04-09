let PAYMENT_METHODS = [
  "webpay"
];

let webpayStrategy = require('../strategies/WebpayStrategy');

function getStrategies(uberSession) {
  return PAYMENT_METHODS;
}

async function loadPreData(method, paymentData) {

}

async function startPayment(paymentData, authSession) {
  switch (paymentData.method) {
    case 'webpay' :
      return await webpayStrategy.startPayment(paymentData, authSession);
    default:
      throw {
        status: 400,
        message: {
          code: 'PaymentMethodUnavailableError',
          msg: 'El método de pago seleccionado no está disponible'
        }
      };
  }
}

async function checkPayment(attempt, authSession) {
  switch (attempt.method) {
    case 'webpay' :
      return await webpayStrategy.checkPayment(attempt, authSession);
    default:
      throw {
        status: 400,
        message: {
          code: 'PaymentMethodUnavailableError',
          msg: 'El método de pago seleccionado no está disponible'
        }
      };
  }
}


module.exports = {
  getStrategies: getStrategies,
  loadPreData: loadPreData,
  startPayment: startPayment,
  checkPayment: checkPayment
};