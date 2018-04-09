let attemptsDataService = require('../payment-sessions-app/services/AttemptsDataService');
let sessionsDataService = require('../payment-sessions-app/services/SessionsDataService');
let dataHelper = require('../payment-sessions-app/services/DataHelperService');
let paymentStrategyService= require('../payment-sessions-app/services/PaymentStrategyService');

async function createCharge(ctx) {
  let charge = ctx.params;
  let session = dataHelper.calculateSession(await sessionsDataService.get(ctx.params.sessionId));
  let result = dataHelper.validateNewAttempt(session.toObject(), charge);
  if (result.isValid) {
    let paymentResult = await paymentStrategyService.startPayment({
      amount : result.attempt.amount,
      method : result.attempt.method,
      type : result.attempt.type,
      name : session.name,
      email : session.mail,
      cpnr : result.attempt.cpnr
    }, { flowId : session.lockId});
    result.attempt.info = paymentResult.info;
    let attempt = await attemptsDataService.save(result.attempt);
    ctx.body = {
      chargeId : attempt._id,
      redirectUrl : paymentResult.redirectUrl
    };
  } else {
    throw {
      status: 401,
      message: {
        code: 'InvalidChargeAttemptError',
        msg: result.reason
      }
    };
  }
}

async function getCharge(ctx) {
  let session = dataHelper.calculateSession(await sessionsDataService.get(ctx.params.sessionId));
  let attempt = dataHelper.validateExistingAttempt(await attemptsDataService.get(ctx.params.sessionId, ctx.params.chargeId)).toObject();
  let paymentResult = await paymentStrategyService.checkPayment(attempt, { flowId : session.lockId});
  //mark amount as paid
  if (paymentResult.isPaid) {
    for (let i = 0; i < session.products.length; i++) {
      let product = session.products[i];
      if (product._id.toString() === attempt.productId) {
        product.amounts.push({
          attemptId : attempt._id,
          value : attempt.amount,
          currency : attempt.currency,
          isPaid : true
        });
        break;
      }
    }
    //no guardar si ya se checkeo ok antes
    await sessionsDataService.save(session);
  }
  ctx.body = {chargeId : attempt._id, status : paymentResult.status};
}



module.exports = {
  createCharge: createCharge,
  getCharge: getCharge,
};

function validateCharge(charge) {

}