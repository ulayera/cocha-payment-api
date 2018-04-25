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
    _id: session._id,
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

async function getSessionAsDeal(ctx) {
  console.log(`SessionsController.getSessionAsDeal() -> ${ctx.req.method} ${ctx.originalUrl}`);
  let session = await paymentLogicService.getSession(ctx.params.sessionId);
  ctx.body = {
    adults: session.descriptions[0].adult,
    children: session.descriptions[0].child,
    departure: session.descriptions[0].departureDate,
    destination: session.descriptions[0].destination,
    infants: session.descriptions[0].infants,
    numberRooms: session.descriptions[0].numberRooms,
    origin: session.descriptions[0].origin,
    product: session.descriptions[0].productType,
    returning: session.descriptions[0].returningDate,
    source: session.descriptions[0].productType + ': ' + session.descriptions[0].destination,
    price: session.total,
    pathError: session.wappErrorUrl,
    pathOk: session.wappOkUrl,
    status: session.status,
  };
}

module.exports = {
  createSession: createSession,
  checkStatus: checkStatus,
  getSession: getSession,
  getSessionAsDeal: getSessionAsDeal,
};