'use strict';
/* jshint strict: false, esversion: 6 */

const paymentSessionModel = require('../models/redis/PaymentSession');
const attemptSessionModel = require('../models/redis/AttemptSession');
const paymentModel = require('../models/mongo/Payment');

const codeSrc = Koa.config.codes.source;

async function create(_ctx) {
  let code = codeSrc[_ctx.params.paymentSrc];
  let now = new Date();
	let session = {
		data: {
      cpnr: _ctx.params.ccode + now.getFullYear() + (now.getMonth() + 1),      
      cochaCode: _ctx.params.ccode,
      paymentSource: _ctx.params.paymentSrc,
      productName: _ctx.params.title,
      price: _ctx.params.clpPrice,
      origin: _ctx.params.origin,
      destination: _ctx.params.destination,
      departure: _ctx.params.departureDate,
      returning: _ctx.params.returningDate,
      contact: _ctx.params.contactEmail,
      rooms: _ctx.params.totalRooms,
      adults: _ctx.params.adult,
      children: _ctx.params.child,
      infants: _ctx.params.infant,
      urlOk: _ctx.params.wappOkUrl,
      urlError: _ctx.params.wappErrorUrl
    },
		attempts: {}
	};

  var payment = new paymentModel.model({
  	cpnr: session.data.cpnr,
    xpnr: session.data.cochaCode,
    source: session.data.paymentSource,
  	total: session.data.price,
  	ttl: moment().unix() + Koa.config.mongoConf.ttlCron,
  	email: session.data.contact,
  	processed: Koa.config.codes.processedFlag.open
  });
  payment = await paymentModel.save(payment);

  let sessionId = payment._id;
  session.data.urlOk += (code + sessionId);
  session.data.urlError += (code + sessionId);
  await paymentSessionModel.setPaymentSession(sessionId, session);

  return sessionId; 
}

async function status(_ctx) {
  try {
    let paymentData = await paymentModel.get(_ctx.params.paymentSessionCode);
    
    let paidAmount = 0;
    _.each(paymentData.status, (record) => {
      if (record.status === Koa.config.states.pending) {
        let existsMatch = _.find(paymentData.status, (recd) => {
          return (recd.id === record.id && recd.amount === record.amount && recd.method == record.method && recd.status === Koa.config.states.paid);
        })
        paidAmount += (existsMatch? parseFloat(existsMatch.amount) : 0);
      }
    });

    if (paidAmount === 0) {
      throw {code: 'NotPaid'};
    } else
    if (paidAmount !== parseFloat(paymentData.total)) {
      throw {code: 'PartiallyPaid'};
    } else 
    if (!paymentData.business) {
      throw {code: 'PaidWithoutBusiness'};
    } else {
      return {
        businessNumber: paymentData.business,
        ccode: paymentData.xpnr
      };
    }
  } catch (err) {
    if (err.code === 'PaymentNotFound') {
      throw {
				status: 404,
				message: {
					code: 'NotFoundError',
					msg: 'Payment session don´t exist'
				}
			};
    } else
    if (err.code === 'NotPaid') {
      throw {
				message: {
					code: 'NotPaidError',
					msg: 'Bill not paid'
				}
			};
    } else
    if (err.code === 'PartiallyPaid') {
      throw {
				message: {
					code: 'PartiallyPaidError',
					msg: 'Payment is not complete'
				}
			};
    } else
    if (err.code === 'PaidWithoutBusiness') {
      throw {
				message: {
					code: 'PaidWithoutBusinessError',
					msg: 'Payment done, but not registered'
				}
			};
    } else {
      throw {
				message: {
					code: 'InternalError',
					msg: 'Payment session status unknown'
        },
        data: err
			};
    }
  }
}

async function get(_ctx) {
  return await paymentSessionModel.getPaymentSession(_ctx.params.paymentSessionCode);
}

async function remove(_ctx, _delPaymentSession = true) {
  await attemptSessionModel.delAttemptSession(_ctx.params.paymentSessionCode)
  if (_delPaymentSession) {
    await paymentSessionModel.deletePaymentSession(_ctx.params.paymentSessionCode);
  }
  return true;
}

async function isValidNewAttempt(_ctx) {
  let rut = cleanRut(_ctx.params.idDocument);
  let paymentSessionData = await paymentSessionModel.getPaymentSession(_ctx.params.paymentSessionCode);
  if (!paymentSessionData.attempts[rut] && Object.keys(paymentSessionData.attempts).length === 5) {
    throw {
      msg: 'Exceeded maximum number of ruts associate per payment',
      code: 'ExceededRutNumberError'
    };
  }
  let attemptSessionData = await attemptSessionModel.getAttemptSession(_ctx.params.paymentSessionCode);
  if (attemptSessionData && attemptSessionData.attemptId !== _ctx.authSession.paymentIntentionId) {
    throw {
      msg: 'Session attempt is not the same',
      code: 'DifferentSessionError'
    };
  }
  return true;
}

async function addAttempt(_ctx) {
  let rut = cleanRut(_ctx.params.idDocument);
  let paymentSessionData = await paymentSessionModel.getPaymentSession(_ctx.params.paymentSessionCode);
  if (!paymentSessionData.attempts[rut] && Object.keys(paymentSessionData.attempts).length === 5) {
    throw {
      msg: 'Exceeded maximum number of ruts associate per payment',
      code: 'ExceededRutNumberError'
    };
  } else
  if (paymentSessionData.attempts[rut]) {
    paymentSessionData.attempts[rut].sessions.push({
      id: _ctx.authSession.paymentIntentionId,
      date: new Date()
    });
  } else {
    paymentSessionData.attempts[rut] = {
      sessions: [{
        id: _ctx.authSession.paymentIntentionId,
        date: new Date()
      }]
    };
  }
  let attemptSessionData = await attemptSessionModel.getAttemptSession(_ctx.params.paymentSessionCode);
  if (attemptSessionData && attemptSessionData.attemptId !== _ctx.authSession.paymentIntentionId) {
    throw {
      msg: 'Session attempt is not the same',
      code: 'DifferentSessionError'
    };
  }
  await attemptSessionModel.setAttemptSession(_ctx.params.paymentSessionCode, {attemptId: _ctx.authSession.paymentIntentionId});
  await paymentSessionModel.setPaymentSession(_ctx.params.paymentSessionCode, paymentSessionData);
  return true;
}

async function isValidAttempt(_ctx) {
  if (await paymentSessionModel.existsPaymentSession(_ctx.params.paymentSessionCode)) {
    let attemptSessionData = await attemptSessionModel.getAttemptSession(_ctx.params.paymentSessionCode);
    if (!attemptSessionData || attemptSessionData.attemptId !== _ctx.authSession.paymentIntentionId) {
      throw {
        msg: 'Session attempt is not the same',
        code: 'DifferentSessionError'
      };
    }
    await attemptSessionModel.setAttemptSession(_ctx.params.paymentSessionCode, {attemptId: _ctx.authSession.paymentIntentionId});
    return true;
  } else {
    throw {
      msg: 'Session payment is close',
      code: 'SessionPaymentCloseError'
    };
  }
}

module.exports = {
  create: create,
  status: status,
  get: get,
  remove: remove,
	isValidNewAttempt: isValidNewAttempt,
	addAttempt: addAttempt,
	isValidAttempt: isValidAttempt	
};

function cleanRut(_rut) {
	return _rut.toString()
		.replace(new RegExp('\\.', 'g'), '')
		.replace("-", "");
}
