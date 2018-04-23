let paymentLogicService = require('../services/PaymentLogicService');

/**
 * Creates and persists a payment session.
 * @param ctx with session data
 * @returns {status, sessionId, url}
 */
async function createSession(ctx) {
  console.log(`SessionsController.createSession() -> ${ctx.req.method} ${ctx.originalUrl}`);
  ctx.body = await paymentLogicService.createSession(ctx.params);
}

async function checkStatus(ctx) {
  console.log(`SessionsController.getStatus() -> ${ctx.req.method} ${ctx.originalUrl}`);
  let session = await paymentLogicService.getSession(ctx.params.sessionId);
  ctx.body = {
    _id : session._id,
    total: session.total,
    totalPaid: session.totalPaid,
    remaining: session.total - session.totalPaid,
    status: session.status
  };
}

async function getSession(ctx) {
  console.log(`SessionsController.getSession() -> ${ctx.req.method} ${ctx.originalUrl}`);
  ctx.body = await paymentLogicService.getSession(ctx.params.sessionId);
}

module.exports = {
  createSession: createSession,
  checkStatus: checkStatus,
  getSession: getSession,
};