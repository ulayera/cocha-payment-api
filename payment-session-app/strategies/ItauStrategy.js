const webpayService = require('../../services/WebpayService');

async function startPayment(paymentData, authSession) {
  let params = {
    commerceCode: Koa.config.commerceCodes.cocha, //Puede ser mas de uno en el futuro
    amount: paymentData.amount,
    cochaCode: paymentData.cpnr,
    holderName: paymentData.name,
    holderEmail: paymentData.email
  };
  //let paymentResult = await webpayService.getPaymentData(params, authSession);
  let paymentResult = {
    "status" : "pending",
    "tokenWebPay" : "6f67b1561cd544d5a8b0bbe16215fbb6",
    "url" : "http://www1-desa.cocha.com/Boton_Pago_PP/onlinePay.asp?token=6f67b1561cd544d5a8b0bbe16215fbb6",
    "idCocha" : "041312011766"
  };
  return {
    redirectUrl : paymentResult.url,
    info : paymentResult
  };
}

async function checkPayment(attempt, authSession) {
  //let checkResult =  await webpayService.checkPayment(attempt.info.tokenWebPay, authSession);
  let checkResult =  {
    "status" : "Complete",
    "tokenWebPay" : "6f67b1561cd544d5a8b0bbe16215fbb6",
    "url" : "http://www1-desa.cocha.com/Boton_Pago_PP/onlinePay.asp?token=6f67b1561cd544d5a8b0bbe16215fbb6",
    "idCocha" : "041312011766"
  };
  return {
    isPaid : String(checkResult.status).toUpperCase() === 'complete'.toUpperCase(),
    status : checkResult.status,
    message : checkResult.message
  };
}

module.exports = {
  strategyName : "itauCanje",
  startPayment: startPayment,
  checkPayment: checkPayment
};