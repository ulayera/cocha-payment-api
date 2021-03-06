'use strict';
/* jshint strict: false, esversion: 6 */

const paymentLogicService = require('../apps/payment-session-app/services/PaymentLogicService');


async function assignTransaction(ctx) {
  console.log("ErpController.assignTransaction() -> " + JSON.stringify(ctx));
  try {
    if (!ctx.params.xpnr || !ctx.params.businessNumber || !ctx.params.sessionToken) {
      throw {
        status: 400,
        message: {
          code: 'ParamsError',
          msg: "Parameters invalid : " + JSON.stringify(ctx.params)
        }
      };
    }

    let result = await paymentLogicService.assignTransaction(ctx.params.sessionToken, ctx.params.businessNumber);
    ctx.status = 200;
    ctx.body = result;
  } catch (err) {
    ctx.status = err.status || 500;
    let detail = ((typeof err.message === 'object') ? err.message : JSON.stringify(err));
    if (err.code === 'PaymentNotFound') {
      throw {
        status: ctx.status,
        message: {
          code: "01"
          , msg: "CPNR NO ENCONTRADO"
          , detail: detail
        }
      };
    } else if (err.code === 'BusinessAlreadyAssigned') {
      throw {
        status: ctx.status,
        message: {
          code: "02"
          , msg: "NEGOCIO YA ASIGNADO"
          , business: err.business || ''
        }
      };
    } else {
      throw {
        status: 500,
        message: {
          code: "03"
          , msg: "ERROR INTERNO"
          , detail: detail
        }
      };
    }
  }
}


async function checkTransaction(ctx) {
  console.log("ErpController.checkTransaction() -> " + JSON.stringify(ctx));
  try {
    if (!ctx.params.xpnr || !ctx.params.sessionToken) {
      throw {
        status: 400,
        message: {
          code: 'ParamsError',
          msg: "Parameters invalid : " + JSON.stringify(ctx.params)
        }
      };
    }

    let result = await paymentLogicService.checkTransaction(ctx.params.sessionToken, ctx.params.xpnr);
    ctx.status = 200;
    ctx.body = result;
  } catch (err) {
    console.log(JSON.stringify(err));
    ctx.status = err.status || 500;
    let detail = ((typeof err.message === 'object') ? err.message : JSON.stringify(err));
    if (err.code === 'PaymentNotFound') {
      throw {
        status: ctx.status,
        message: {
          code: "01"
          , msg: "CPNR NO ENCONTRADO"
          , detail: detail
        }
      };
    } else if (err.code === 'BusinessNotAssigned') {
      throw {
        status: ctx.status,
        message: {
          code: "02"
          , msg: "NEGOCIO NO ASIGNADO"
        }
      };
    } else {
      throw {
        status: 500,
        message: {
          code: "03"
          , msg: "ERROR INTERNO"
          , detail: detail
        }
      };
    }
  }
}

async function status(ctx) {
  console.log(`ErpController.status() -> ${ctx.req.method} ${ctx.originalUrl}`);
  let session = await paymentLogicService.getSession(ctx.params.sessionId);
  ctx.body = {
    businessNumber: session._id.toString(),
    ccode: session.refCode,
    status: (session.status.toUpperCase() === Koa.config.states.complete) ? 'ok' : 'Pending'
  }
}

module.exports = {
  assignTransaction: assignTransaction,
  checkTransaction: checkTransaction,
  status: status,
};