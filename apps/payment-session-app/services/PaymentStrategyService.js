let PAYMENT_METHODS = ["webpay"];

let webpayStrategy = require('../strategies/WebpayStrategy');

async function startPayment(paymentData, authSession) {
  switch (paymentData.method) {
    case 'webpay' :
      return await webpayStrategy.startPayment(paymentData, authSession);
    case 'TarjetaRipley' :
      return await webpayStrategy.startPayment(paymentData, authSession);
    default:
      throw {
        status: 400,
        message: {
          code: 'PaymentMethodUnavailableError',
          msg: 'El método de pago seleccionado no está disponible: ' + paymentData.method
        }
      };
  }
}

async function checkPayment(attempt, authSession) {
  switch (attempt.method) {
    case 'webpay' :
      return await webpayStrategy.checkPayment(attempt, authSession);
    case 'TarjetaRipley' :
      return await webpayStrategy.checkPayment(attempt, authSession);
    default:
      throw {
        status: 400,
        message: {
          code: 'PaymentMethodUnavailableError',
          msg: 'El método de pago seleccionado no está disponible: ' + attempt.method
        }
      };
  }
}


module.exports = {
  PAYMENT_METHODS: PAYMENT_METHODS,
  startPayment: startPayment,
  checkPayment: checkPayment
};