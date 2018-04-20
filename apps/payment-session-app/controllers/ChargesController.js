let paymentLogicService = require('../services/PaymentLogicService');

async function createCharge(ctx) {
  let charge = await paymentLogicService.createCharge(ctx.params);
  if (charge.isValid === false) {
    throw {
      status: 400,
      message: {
        code: 'InvalidChargeError',
        msg: charge.reason
      }
    };
  }
  ctx.body = {
    chargeId: charge._id,
    status: charge.status,
    redirectUrl: charge.redirectUrl
  };
}

async function getCharge(ctx) {
  let attempt = await paymentLogicService.getCharge(ctx.params.sessionId, ctx.params.chargeId);
  ctx.body = {
    chargeId: attempt._id, status: attempt.status
  };
}


module.exports = {
  createCharge: createCharge,
  getCharge: getCharge,
};