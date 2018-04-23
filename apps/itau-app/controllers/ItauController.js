'use strict';
/* jshint strict: false, esversion: 6 */
const itauClientService = require('../services/ItauLogicService');


async function attemptLogin(ctx) {
  let itauCustomerData = await itauClientService.generateDynamicKey(ctx);
  ctx.body = {
    dynamicKey: itauCustomerData.dynamicKey,
    rut : itauCustomerData.rut + '-' + itauCustomerData.dv,
    phoneNumber : itauCustomerData.phoneNumber,
    email : itauCustomerData.email,
  };
}


async function getBalance(ctx) {
  let itauCustomerAccountBalanceData = await itauClientService.getBalance(ctx);
  ctx.body = {
    numeroTarjeta : itauCustomerAccountBalanceData.numeroTarjeta,
    tipoTarjeta : itauCustomerAccountBalanceData.tipoTarjeta,
    saldoDisponibleConversion : itauCustomerAccountBalanceData.saldoDisponibleConversion,
  };
}

async function freezeAmount(ctx) {
  let freezeAmountData = await itauClientService.freezeAmount(ctx);
  ctx.body = {
    status : freezeAmountData.status,
    redirectUrl : freezeAmountData.redirectUrl,
    chargeId : freezeAmountData.chargeId,
  };
}

module.exports = {
  attemptLogin: attemptLogin,
  getBalance: getBalance,
  freezeAmount: freezeAmount,
};