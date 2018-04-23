const itauClientService = require('./ItauClientService');
const itauLoginSession = require('../models/redis/ItauSession');
const sessionsDataService = require('./SessionsDataService');
const paymentClientService = require('./PaymentClientService');

async function generateDynamicKey(ctx) {
  let session = await sessionsDataService.get(ctx.params.sessionId);
  if (ctx.params.rut.indexOf('-') > -1) {
    ctx.params.dv = ctx.params.rut.split('-')[1];
    ctx.params.rut = ctx.params.rut.split('-')[0];
  }
  let args = {
    rut: ctx.params.rut,
    dv: ctx.params.dv,
    authSession: ctx.authSession || {}
  };
  let validateRutResponse = await itauClientService.validateRut(args);
  args = {
    rut: ctx.params.rut,
    dv: ctx.params.dv,
    phoneNumber: validateRutResponse.phoneNumber,
    email: validateRutResponse.email,
    authSession: ctx.authSession || {}
  };
  let dynamicKeyData = await itauClientService.generateDynamicKey(args);
  itauLoginSession.createItauSession(ctx.params.sessionId, {
    sessionId: session._id,
    rut: args.rut,
    dv: args.dv,
    phoneNumber: args.phoneNumber,
    email: args.email,
    dynamicKey: dynamicKeyData.key,
    dynamicKeyId: dynamicKeyData.id,
    status: Koa.config.states.created
  });
  return {
    dynamicKey: dynamicKeyData.key,
    rut: args.rut,
    dv: args.dv,
    phoneNumber: args.phoneNumber,
    email: args.email,
    status: Koa.config.states.created
  };
}

async function getBalance(ctx) {
  let session = await sessionsDataService.get(ctx.params.sessionId);
  let itauSession = await itauLoginSession.getItauSession(session._id.toString());
  if (ctx.params.rut.indexOf('-') > -1) {
    ctx.params.dv = ctx.params.rut.split('-')[1];
    ctx.params.rut = ctx.params.rut.split('-')[0];
  }
  let args = {
    rut: ctx.params.rut,
    dv: ctx.params.dv,
    dynamicKey: ctx.params.dynamicKey,
    dynamicKeyId: itauSession.dynamicKeyId,
    authSession: ctx.authSession || {}
  };
  if (itauSession.status !== Koa.config.states.complete) {
    await itauClientService.checkDynamicKey(args);
    itauSession.status = Koa.config.states.complete;
  }
  args = {
    rut: ctx.params.rut,
    dv: ctx.params.dv,
    dynamicKeyId: itauSession.dynamicKeyId,
    authSession: ctx.authSession || {}
  };
  let accountsData = await itauClientService.listAccounts(args);
  let biggerBalanceAccount = {
    saldoDisponibleConversion: 0
  };
  _.each(accountsData, (account) => {
    if (account.saldoDisponibleConversion > biggerBalanceAccount.saldoDisponibleConversion) {
      biggerBalanceAccount = account;
    }
  });
  args.accountId = biggerBalanceAccount.cuentaId
  await itauClientService.selectAccount(args);
  itauSession.productId = biggerBalanceAccount.productId;
  itauSession.cuentaId = biggerBalanceAccount.cuentaId;
  itauLoginSession.updateItauSession(session._id.toString(), itauSession);
  return {
    numeroTarjeta: biggerBalanceAccount.numeroTarjeta,
    tipoTarjeta: biggerBalanceAccount.tipoTarjeta,
    saldoDisponibleConversion: biggerBalanceAccount.saldoDisponibleConversion,
  };
}

async function freezeAmount(ctx) {
  let itauSession = await itauLoginSession.getItauSession(ctx.params.sessionId);
  let session = await sessionsDataService.get(ctx.params.sessionId);
  if (session.amounts && session.amounts.length > 0) {
    throw {
      msg: 'Itaú amount already created or bad request',
      code: 'SessionAmountsNotEmptyError',
      status: 401
    }
  }
  let preExchangeData = await itauClientService.requestPreExchange({
    rut: itauSession.rut,
    dv: itauSession.dv,
    dynamicKeyId: itauSession.dynamicKeyId,
    cuentaId: itauSession.cuentaId,
    productId: session.refCode,
    spendingAmount: ctx.params.amount,
    authSession: ctx.authSession || {}
  });
  preExchangeData.rut = itauSession.rut;
  preExchangeData.dv = itauSession.dv;
  preExchangeData.productId = session.refCode;
  await persistToSession(session, preExchangeData);
  return await paymentClientService.postCharges({
    sessionId : session._id.toString(),
    method : "webpay",
    amount : session.toSplitAmount.value //remaining value is already reduced
  });
}

async function spendFrozenAmount(ctx) {
  let args = {
    rut: ctx.rut,
    dv: ctx.dv,
    preExchangeId: ctx.canjeId,
    spendingAmount: ctx.spendingAmount,
    extraExchangeAmount: 0,
    productName: null,
    productId: ctx.productId,
    authSession: ctx.authSession || {}
  };
  return await itauClientService.requestExchange(args);
}

async function freeFrozenAmount() {
  
}

async function persistToSession(session, preExchangeData) {
  let amount = session.amounts.create({
    name: session.toSplitAmount.label,
    value: preExchangeData.spentAmount,
    currency: 'CLP',
    refCode: session.refCode,
    isPaid: true
  });
  let status = session.statuses.create({
    amountId: amount._id,
    amount: amount.value,
    method: 'itau',
    currency: amount.currency,
    date: new Date(),
    status: Koa.config.states.paid,
    info: preExchangeData
  });
  session.amounts.push(amount);
  session.toSplitAmount.value -= amount.value;
  session.statuses.push(status);
  await sessionsDataService.save(session);
}

module.exports = {
  generateDynamicKey: generateDynamicKey,
  getBalance: getBalance,
  freezeAmount: freezeAmount,
  spendFrozenAmount: spendFrozenAmount,
  freeFrozenAmount: freeFrozenAmount,
};