const webpayService = require('../../services/WebpayService');

async function loadPreData() {
  return true;
}

async function startPayment(paymentData, authSession) {
  let params = {
    commerceCode: Koa.config.commerceCodes.cocha, //Puede ser mas de uno en el futuro
    amount: paymentData.amount,
    cochaCode: paymentData.cpnr,
    holderName: paymentData.name,
    holderEmail: paymentData.email
  };
  let paymentResult = await webpayService.getPaymentData(params, authSession);
  return {
    redirectUrl : paymentResult.url,
    info : paymentResult
  };
}

async function checkPayment(attempt, authSession) {
  let checkResult =  await webpayService.checkPayment(attempt.info.tokenWebPay, authSession);
  //dummy
  checkResult.status = 'complete';
  return {
    isPaid : checkResult.status.toUpperCase() === 'complete'.toUpperCase(),
    status : checkResult.status,
    message : checkResult.message
  };
}

module.exports = {
  strategyName : "webpay",
  loadPreData: loadPreData,
  startPayment: startPayment,
  checkPayment: checkPayment
};