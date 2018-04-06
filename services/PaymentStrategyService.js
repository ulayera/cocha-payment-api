let PAYMENT_METHODS = [
  "webpay"
];

let webpayStrategy = require('../strategies/WebpayStrategy');

// let normalizedPath = require("path").join(__dirname, "../strategies");
// require("fs").readdirSync(normalizedPath).forEach(function(file) {
//   PAYMENT_METHODS.push(require("../strategies/" + file));
// });

function getStrategies(uberSession) {
  return PAYMENT_METHODS;
}

//
// function strategy(selectedMethod) {
//   let method =
//   _.filter(PAYMENT_METHODS, function (method) {
//     return method.strategyName === selectedMethod;
//   });
//   if (method)
//     return method;
//   throw {
//     status: 400,
//     message: {
//       code: 'PaymentMethodUnavailableError',
//       msg: 'El método de pago seleccionado no está disponible'
//     }
//   };
// }

async function loadPreData(method, paymentData) {

}

async function startPayment(method, paymentData, amounts, authSession) {
  switch (method) {
    case 'webpay' :
      return await webpayStrategy.startPayment(paymentData, amounts, authSession);
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

async function checkPayment(method, paymentData, attempt, authSession) {
  switch (method) {
    case 'webpay' :
      return await webpayStrategy.checkPayment(paymentData, attempt, authSession);
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