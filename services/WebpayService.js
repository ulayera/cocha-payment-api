'use strict';
/* jshint strict: false, esversion: 6 */

const soapServices = require('./SoapService');
const logService = require('./LogService');

async function getPaymentData(_paymentParams, _workflowData) {
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
        storeCode: _paymentParams.commerceCode,
        storeOC: _paymentParams.cochaCode,
        storeCost: String(_paymentParams.amount)
      }
    }
  }
  _workflowData.serviceContext = 'payment';
  _workflowData.logFunction = logService.logCallToService;
  let paymenData = await soapServices.callService(url, 'onlinePayWS', params, _workflowData);
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

async function checkPayment(_paymentToken, _workflowData) {
  let url = Koa.config.path.webpay.getPaymentStatus;
  let params = {
    token: _paymentToken
  }
  _workflowData.serviceContext = 'payment';
  _workflowData.logFunction = logService.logCallToService;
  let paymenStatusData = await soapServices.callService(url, 'getPayStatusWS', params, _workflowData);
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





