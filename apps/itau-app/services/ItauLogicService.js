const itauClientService = require('./ItauClientService');
const itauLoginSession = require('../models/redis/ItauSession');
const sessionsDataService = require('./SessionsDataService');
const paymentClientService = require('./PaymentClientService');
const erpServices = require('../../../services/ErpService');
const slackService = require('../../../services/SlackService');
const confirmationServices = require('../../../services/ConfirmationService');

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
  args.accountId = biggerBalanceAccount.cuentaId;
  await itauClientService.selectAccount(args);
  itauSession.productId = biggerBalanceAccount.productId;
  itauSession.cuentaId = biggerBalanceAccount.cuentaId;
  itauLoginSession.updateItauSession(session._id.toString(), itauSession);
  return {
    numeroTarjeta: biggerBalanceAccount.numeroTarjeta,
    tipoTarjeta: biggerBalanceAccount.tipoTarjeta,
    saldoDisponible: biggerBalanceAccount.saldoDisponible,
    saldoDisponibleConversion: biggerBalanceAccount.saldoDisponibleConversion,
  };
}

async function freezeAmount(ctx) {
  let itauSession = await itauLoginSession.getItauSession(ctx.params.sessionId);
  let session = await sessionsDataService.get(ctx.params.sessionId);
  /**
   * valida que sea el primer canje itaú de la sesión
   */
  if (session.amounts && session.amounts.length > 0) {
    throw {
      msg: 'Itaú amount already created or bad request',
      code: 'SessionAmountsNotEmptyError',
      status: 401
    }
  }
  /**
   * realiza preCanje hacia servicios de itaú
   */
  let preExchangeData = await itauClientService.requestPreExchange({
    rut: itauSession.rut,
    dv: itauSession.dv,
    dynamicKeyId: itauSession.dynamicKeyId,
    cuentaId: itauSession.cuentaId,
    productId: session.refCode,
    spendingAmount: ctx.params.amount,
    authSession: ctx.authSession || {}
  });
  /**
   * guarda el amount como pagado y el intento de pago (status) con la data de itaú
   */
  preExchangeData.rut = itauSession.rut;
  preExchangeData.dv = itauSession.dv;
  preExchangeData.productId = session.refCode;
  let status = await persistToSession(session, preExchangeData);
  /**
   * si el pago de itaú no cubre el total a pagar, se genera un pago webpay y retorna
   * si cubre el total, confirma el canjey retorna ok
   */
  if (session.toSplitAmount.value > 0) {
    return await paymentClientService.postCharges({
      sessionId: session._id.toString(),
      method: "webpay",
      amount: session.toSplitAmount.value //remaining value is already reduced
    });
  } else {
    let spendFrozenAmountData = await spendFrozenAmount({
      rut: status.info.rut,
      dv: status.info.dv,
      canjeId: status.info.id,
      spendingAmount: status.amount,
      productId: status.info.productId,
    });
    await closeCurrentPayment(session, ctx);
    // valida que el canje definitivo se realizó ok antes de retornar
    if (!spendFrozenAmountData || !spendFrozenAmountData.id) {
      throw {
        msg: 'Couldn\'t confirm Itaú payment.',
        code: 'SessionAmountsNotEmptyError',
        status: 401
      };
    } else {
      status.status = Koa.config.states.closed;
      await sessionsDataService.save(session);
    }
    return {
      status: Koa.config.states.complete
    };
  }
}

async function checkPaymentAndRetry(ctx) {
  let session = await sessionsDataService.get(ctx.params.sessionId);
  /**
   * busca el charge mediante el webpayId a validar
   */
  let chargeId = _.find(session.statuses,
    status =>
      status.info.tokenWebPay === ctx.params.webpayId
  )._id.toString();
  console.log(chargeId);
  let chargeStatus = await paymentClientService.getCharge({sessionId : ctx.params.sessionId, chargeId : chargeId});
  console.log(JSON.stringify(chargeStatus,null,2));
  /**
   * valida intentos maximos webpay (3)
   */
  if (_.filter(session.statuses, status => status.method === 'webpay').length > 2) {
    throw {
      status: 500,
      message: {
        code: 'PaymentAttemptsError',
        msg: 'You have exceeded the number of payment attempts'
      }
    };
  }
  /**
   * si el cargo no esta pagado, crea otro y retorna url webpay
   * de lo contrario, retorna ok
   */
  if (chargeStatus.status.toUpperCase() !== Koa.config.states.paid.toUpperCase()) {
    let postChargesData = await paymentClientService.postCharges({
      sessionId: session._id.toString(),
      method: "webpay",
      amount: session.toSplitAmount.value //remaining value is already reduced
    });
    return {
      status: Koa.config.states.pending,
      url: postChargesData.redirectUrl,
      okPath: null,
      errPath: null
    };
  } else {
    let status = _.find(session.statuses,
      status =>
        status.status.tokenWebPay === Koa.status.states.paid &&
        status.method.toLowerCase() === 'itau'
    );
    let spendFrozenAmountData = await spendFrozenAmount({
      rut: status.info.rut,
      dv: status.info.dv,
      canjeId: status.info.id,
      spendingAmount: status.amount,
      productId: status.info.productId,
    });
    await closeCurrentPayment(session, ctx);
    // valida que el canje definitivo se realizó ok antes de retornar
    if (!spendFrozenAmountData || !spendFrozenAmountData.id) {
      throw {
        msg: 'Couldn\'t confirm Itaú payment.',
        code: 'SessionAmountsNotEmptyError',
        status: 401
      };
    } else {
      status.status = Koa.config.states.closed;
      await sessionsDataService.save(session);
    }
    return {
      status: Koa.config.states.complete,
      url: null,
      okPath: session.wappOkUrl + session._id.toString(),
      errPath: session.wappErrorUrl + session._id.toString()
    };
  }
}

async function unfreezeAmount(ctx) {
  let session = await sessionsDataService.get(ctx.params.sessionId);
  let status = _.find(session.statuses, (status) => {
    return status.method.toLowerCase() === 'itau';
  });
  let args = {
    rut: status.info.rut,
    dv: status.info.dv,
    preExchangeId: status.info.id,
    authSession: ctx.authSession || {}
  };
  let cancelPreExchangeData = await itauClientService.cancelPreExchange(args);
  return {
    status: 'Complete',
    okPath: session.wappOkUrl + session._id.toString(),
    errPath: session.wappErrorUrl + session._id.toString()
  };
}

module.exports = {
  generateDynamicKey: generateDynamicKey,
  getBalance: getBalance,
  freezeAmount: freezeAmount,
  unfreezeAmount: unfreezeAmount,
  checkPaymentAndRetry: checkPaymentAndRetry,
};
/*
 Locally used functions
 */

async function closeCurrentPayment(session, ctx) {
  let itauStatus = _.find(session.statuses, status=>
    (status.method.toLowerCase()==='itau' &&
      status.status.toUpperCase()===Koa.config.states.paid)
  );
  let informPaymentData = await erpServices.informPayment(
    ctx.params.sessionId,
    {
      rut: itauStatus.info.rut + '-' + itauStatus.info.dv,
      paymentId: itauStatus.info.id
    },
    itauStatus.info.spentAmount,
    Koa.config.codes.type.points,
    Koa.config.codes.method.itau,
    ctx.authSession,
    itauStatus.info.productId
  );
  if (!informPaymentData || !informPaymentData.STATUS || informPaymentData.STATUS.toUpperCase() !== 'OK') {
    console.log("SlackService.log");
    slackService.log('info', JSON.stringify(informPaymentData), 'Smart Error');
  }
  console.log("ConfirmationServices.reportPay");
  await confirmationServices.reportPay( {
    productSrc : session.descriptions[0].productType,
    sessionId : ctx.params.sessionId
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
  return status;
}
