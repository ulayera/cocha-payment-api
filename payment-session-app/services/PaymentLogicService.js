let sessionsDataService = require('./SessionsDataService');
let dataHelper = require('./DataHelperService');
let paymentStrategyService = require('./PaymentStrategyService');

async function createSession(sessionCandidate) {
  let session = dataHelper.validateSession(sessionCandidate);
  session.status = Koa.config.states.created;
  return await sessionsDataService.save(session);
}

async function getSession(sessionId) {
  return dataHelper.calculateSession(await sessionsDataService.get(sessionId));
}

async function createCharge(charge) {
  let session = await dataHelper.calculateSession((await sessionsDataService.get(charge.sessionId)));
  let validationResult = await dataHelper.validateNewAttempt(session, charge);
  if (validationResult.isValid) {
    let amount;
    if (charge.amountId) {
      amount = _.filter(session.amounts, a => a._id.toString() === charge.amountId).first().value();
    } else {
      amount = {
        name: session.toSplitAmount.label,
        value: charge.amount,
        currency: (session.toSplitAmount.currency) ? session.toSplitAmount.currency : 'CLP',
        refCode : (session.toSplitAmount.refCode) ? session.toSplitAmount.refCode : session.refCode
      }
    }
    let status = {
      amountId: amount._id,
      amount: amount.value,
      method: charge.method,
      currency: amount.currency,
      date: new Date(),
      status: Koa.config.states.pending
    };
    let paymentData = {
      amount: amount.value,
      method: status.method,
      name: session.name,
      email: session.mail,
      refCode: amount.refCode
    };
    let paymentResult = await paymentStrategyService.startPayment(paymentData, {
      flowId: session.lockId,
      sessionId: session._id
    });
    status.info = paymentResult.info;
    session.statuses.push(status);
    session = await sessionsDataService.save(session);
    _.each(session.statuses, (s) => {
      if (s.date.getTime() === status.date.getTime()) status = s;
    });
    status.redirectUrl = paymentResult.redirectUrl;
    return status;
  } else {
    return validationResult;
  }
}

async function getCharge(sessionId, chargeId) {
  let session = dataHelper.calculateSession((await sessionsDataService.get(sessionId)));
  let attempt = dataHelper.validateExistingAttempt(
    _.filter(session.statuses, s => s._id.toString() === chargeId)[0]);
  let paymentResult = await paymentStrategyService.checkPayment(attempt, {
    flowId: session.lockId,
    sessionId: session._id
  });
  if ((String(attempt.status)).toUpperCase() === Koa.config.states.pending &&
    paymentResult.isPaid) {
    let amount;
    if (session.toSplitAmount) {
      amount = session.amounts.create({
        name: session.toSplitAmount.label,
        value: attempt.amount,
        currency: attempt.currency,
        refCode: (session.toSplitAmount.refCode) ? session.toSplitAmount.refCode : session.refCode,
        isPaid: true
      });
      session.toSplitAmount.value -= amount.value;
      session.amounts.push(amount);
    } else {
      amount = _.filter(session.amounts, a => a._id.toString() === attempt.amountId)[0];
    }
    attempt.status = Koa.config.states.paid;
    attempt.amountId = amount._id;
    session = dataHelper.calculateSession(session);
    await sessionsDataService.save(session);
  }
  return attempt;
}

module.exports = {
  createSession : createSession,
  getSession : getSession,
  createCharge : createCharge,
  getCharge : getCharge,
};