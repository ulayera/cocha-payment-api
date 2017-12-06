'use strict';
/* jshint strict: false, esversion: 6 */

const soapServices = require('./SoapService');

async function getPaymentData(_paymentParams) {
  let url = Koa.config.path.webpay.setPayment;
  let params = {
    paySource: _paymentParams.source || 'OJ', //xsd:string|OJ,SMART,
    payMode: _paymentParams.type || 'WebPay', //xsd:string|BancoChile,BancoSantander,WebPay,TarjetaRipley,
    titularName: _paymentParams.holderName,
    titularEmail: _paymentParams.holderEmail,
    totalCost: Number(_paymentParams.amount),
    ocNumber: _paymentParams.cochaCode,
    chargesNumber: 1,
    commerceName: Koa.config.appName,
    charges: {
      charge: {
        storeCode: Koa.config.commerceCode,
        storeOC: _paymentParams.cochaCode,
        storeCost: String(_paymentParams.amount)
      }
    }
  }
  let paymenData = await soapServices.callService(url, 'onlinePayWS', params);
  if (paymenData.code !== '00') {
    throw {
      message: {
        code: 'PaymentWPError',
        msg: paymenData.message
      }
    };
  } else {
    return {
      status: 'Complete',
      tokenWebPay: paymenData.token,
      url: Koa.config.path.webpay.processPayment.replace(':token', paymenData.token),
      idCocha: paymenData.idCocha
    };
  }
}

async function checkPayment(_paymentToken) {
  let url = Koa.config.path.webpay.getPaymentStatus;
  let params = {
    token: _paymentToken
  }
  let paymenStatusData = await soapServices.callService(url, 'getPayStatusWS', params);
  if (paymenStatusData.code !== '00') {
    return {
      status: 'Pending',
      message: paymenStatusData.message
    };
  }  else {
    let charge = paymenStatusData.charges.charge[0];
    if (charge.status === 'APROBADA') {
      return {
        status: 'Complete',
        message: 'Aprobado',
        paymentType: charge.medioPago,
        idCocha: charge.idCocha,
        authorizationCode: charge.codigoAutorizacion,        
        cardNumber: charge.numeroTarjeta,
        cardExp: charge.expTarjeta,
        cardType: charge.marcaTC,
        dues: charge.cuotas,
        amount: charge.monto  
      };
    } else {
      return {
        status: 'Pending',
        message: paymenStatusData.message
      };
    }
  }
}

module.exports = {
  getPaymentData: getPaymentData,
  checkPayment: checkPayment
};





