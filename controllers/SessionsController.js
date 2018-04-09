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
    _id : session._id,
    total: session.total,
    totalPaid: session.totalPaid,
    status: session.status,
    products : []
  };
  //output all products status
  _.each(session.products, (p)=>{
    ctx.body.products.push({
      _id : p._id,
      total: p.total,
      totalPaid: p.totalPaid,
    });
  });
}

async function getSession(ctx) {
  console.log(`SessionsController.getSession() -> ${ctx.req.method} ${ctx.originalUrl}`);
  ctx.body = dataHelper.calculateSession(await sessionsDataService.get(ctx.params.sessionId));
}

module.exports = {
  createSession: createSession,
  checkStatus: checkStatus,
  getSession: getSession,
};