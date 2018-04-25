'use strict';
/* jshint strict: false, esversion: 6 */
const itauLogicService = require('../services/ItauLogicService');


async function attemptLogin(ctx) {
  console.log(`ItauController.attemptLogin() -> ${ctx.req.method} ${ctx.originalUrl}`);
  let itauCustomerData = await itauLogicService.generateDynamicKey(ctx);
  ctx.body = {
    dynamicKey: itauCustomerData.dynamicKey,
    rut : itauCustomerData.rut + '-' + itauCustomerData.dv,
    phoneNumber : itauCustomerData.phoneNumber,
    email : itauCustomerData.email,
  };
}


async function getBalance(ctx) {
  console.log(`ItauController.getBalance() -> ${ctx.req.method} ${ctx.originalUrl}`);
  let itauCustomerAccountBalanceData = await itauLogicService.getBalance(ctx);
  ctx.body = {
    numeroTarjeta : itauCustomerAccountBalanceData.numeroTarjeta,
    tipoTarjeta : itauCustomerAccountBalanceData.tipoTarjeta,
    saldoDisponible : itauCustomerAccountBalanceData.saldoDisponible,
    saldoDisponibleConversion : itauCustomerAccountBalanceData.saldoDisponibleConversion,
  };
}

async function freezeAmount(ctx) {
  console.log(`ItauController.freezeAmount() -> ${ctx.req.method} ${ctx.originalUrl}`);
  let freezeAmountData = await itauLogicService.freezeAmount(ctx);
  ctx.body = {
    status : freezeAmountData.status,
    url : freezeAmountData.redirectUrl,
    chargeId : freezeAmountData.chargeId,
  };
}

async function checkPaymentAndRetry(ctx) {
  console.log(`ItauController.checkPaymentAndRetry() -> ${ctx.req.method} ${ctx.originalUrl}`);
  ctx.body = await itauLogicService.checkPaymentAndRetry(ctx);
}

module.exports = {
  attemptLogin: attemptLogin,
  getBalance: getBalance,
  freezeAmount: freezeAmount,
  checkPaymentAndRetry: checkPaymentAndRetry,
};