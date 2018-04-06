let sessionsDataService = require('../payment-sessions-app/services/SessionsDataService');
let dataHelper = require('../payment-sessions-app/services/DataHelperService');

/**
 * Creates and persists a payment session.
 * @param ctx with session data
 * @returns {status, sessionId, url}
 */
async function createSession(ctx) {
  console.log(`SessionsController.createSession() -> ${ctx.req.method} ${ctx.originalUrl}`);
  ctx.body = await sessionsDataService.save(dataHelper.validateSession(ctx.params));
}

async function checkStatus(ctx) {
  console.log(`SessionsController.getStatus() -> ${ctx.req.method} ${ctx.originalUrl}`);
  let session = dataHelper.calculateSession(await sessionsDataService.get(ctx.params.sessionId));
  ctx.body = {
    total: session.total,
    totalPaid: session.totalPaid,
    status: session.status,
  };
}

async function getSession(ctx) {
  console.log(`SessionsController.getSession() -> ${ctx.req.method} ${ctx.originalUrl}`);
  ctx.body = calculateSession(await sessionsDataService.get(ctx.params.sessionId));
}

module.exports = {
  createSession: createSession,
  checkStatus: checkStatus,
  getSession: getSession,
};