let attemptsDataService = require('../payment-sessions-app/services/AttemptsDataService');
let sessionsDataService = require('../payment-sessions-app/services/SessionsDataService');
let dataHelper = require('../payment-sessions-app/services/DataHelperService');

async function createCharge(ctx) {
  let charge = ctx.params;
  let session = dataHelper.calculateSession(await sessionsDataService.get(ctx.params.sessionId));
  let result = dataHelper.validateNewAttempt(session.toObject(), charge);
  if (result.isValid) {
    console.log("iniciarPago");
  } else {
    throw {
      status: 401,
      message: {
        code: 'ChargeAttemptError',
        msg: result.reason
      }
    };
  }
}

async function getCharge(ctx) {
  let sessionId = ctx.params.sessionId;
  let session = await sessionPaymentService.getUberSession(sessionId);
  let chargeId = ctx.params.chargeId;
  let attempt = _.chain(session.attempts).filter((a) => {
    return a._id.toString() === chargeId;
  }).first().value();
  let returnedPaymentData = await paymentStrategyService.checkPayment(attempt.method, session, attempt, {});
  let status = returnedPaymentData.status;
  if (status === 'TirrilePagao') {
    for (let i in session.amounts) {
      let currAmount = session.amounts[i];
      if (attempt.amounts.indexOf(currAmount._id.toString()) > -1) {
        currAmount.isPaid = true;
      }
    }
    await sessionPaymentService.saveUberSession(session);
  }
  ctx.body = {chargeId : attempt._id, status : status};
}



module.exports = {
  createCharge: createCharge,
  getCharge: getCharge,
};

function validateCharge(charge) {

}