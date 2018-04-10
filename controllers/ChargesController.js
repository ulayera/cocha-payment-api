let attemptsDataService = require('../payment-sessions-app/services/AttemptsDataService');
let sessionsDataService = require('../payment-sessions-app/services/SessionsDataService');
let dataHelper = require('../payment-sessions-app/services/DataHelperService');
let paymentStrategyService = require('../payment-sessions-app/services/PaymentStrategyService');

async function createCharge(ctx) {
  let charge = ctx.params;
  let session = dataHelper.calculateSession(await sessionsDataService.get(ctx.params.sessionId));
  let attemptCandidate = dataHelper.validateNewAttempt(session.toObject(), charge);
  session = await sessionsDataService.save(attemptCandidate.session);
  if (attemptCandidate.isValid) {
    let paymentResult = await paymentStrategyService.startPayment({
      amount: attemptCandidate.attempt.amount,
      method: attemptCandidate.attempt.method,
      type: attemptCandidate.attempt.type,
      name: session.name,
      email: session.mail,
      cpnr: attemptCandidate.attempt.cpnr
    }, {flowId: session.lockId});
    attemptCandidate.attempt.info = paymentResult.info;
    let attempt = await attemptsDataService.save(attemptCandidate.attempt);
    ctx.body = {
      chargeId: attempt._id,
      status: attempt.status,
      redirectUrl: paymentResult.redirectUrl
    };
  } else {
    throw {
      status: 401,
      message: {
        code: 'InvalidChargeAttemptError',
        msg: attemptCandidate.reason
      }
    };
  }
}

async function getCharge(ctx) {
  let session = dataHelper.calculateSession(await sessionsDataService.get(ctx.params.sessionId));
  let attempt = dataHelper.validateExistingAttempt(await attemptsDataService.get(ctx.params.sessionId, ctx.params.chargeId)).toObject();
  let paymentResult = await paymentStrategyService.checkPayment(attempt, {flowId: session.lockId});
  if ((String(attempt.status)).toUpperCase() !== Koa.config.states.complete && paymentResult.isPaid) {
    for (let i = 0; i < session.products.length; i++) {
      let product = session.products[i];
      if (product._id.toString() === attempt.productId) {
        if (attempt.amountId) {
          for (let j = 0; j < product.amounts.length; j++) {
            if (product.amounts[j]._id.toString() === attempt.amountId) {
              product.amounts[j].attemptId = attempt._id;
              product.amounts[j].isPaid = true;
            }
          }
        } else {
          product.amounts.push({
            attemptId: attempt._id,
            value: attempt.amount,
            currency: attempt.currency,
            isPaid: true
          });
        }
        break;
      }
    }
    attempt.status = Koa.config.states.paid;
    await attemptsDataService.save(attempt);
    session = dataHelper.calculateSession(session);
    await sessionsDataService.save(session);
  }
  ctx.body = {chargeId: attempt._id, status: attempt.status};
}


module.exports = {
  createCharge: createCharge,
  getCharge: getCharge,
};