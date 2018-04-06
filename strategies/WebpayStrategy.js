const webpayService = require('../services/WebpayService');

async function loadPreData() {
  return true;
}

async function startPayment(paymentData, amounts, authSession) {
  let params = {
    commerceCode: Koa.config.commerceCodes.cocha, //Puede ser mas de uno en el futuro
    amount: 0,
    cochaCode: paymentData.cpnr,
    holderName: paymentData.name,
    holderEmail: paymentData.email
  };
  _.each(amounts, (a) => {params.amount += a.amount});
  return await webpayService.getPaymentData(params, authSession);
}

async function checkPayment(paymentData, attempt, authSession) {
  return await webpayService.checkPayment(attempt.attempt.tokenWebPay, authSession);
}

module.exports = {
  strategyName : "webpay",
  loadPreData: loadPreData,
  startPayment: startPayment,
  checkPayment: checkPayment
};