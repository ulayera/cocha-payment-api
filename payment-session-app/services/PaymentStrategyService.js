let PAYMENT_METHODS = ["webpay", "itau"];

let webpayStrategy = require('../strategies/WebpayStrategy');

async function startPayment(paymentData, authSession) {
  switch (paymentData.method) {
    case 'webpay' :
      return await webpayStrategy.startPayment(paymentData, authSession);
    case 'itau' :
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
    case 'itau' :
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
  PAYMENT_METHODS: PAYMENT_METHODS,
  startPayment: startPayment,
  checkPayment: checkPayment
};