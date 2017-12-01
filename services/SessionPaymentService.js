'use strict';
/* jshint strict: false, esversion: 6 */

const paymentSessionModel = require('../models/redis/PaymentSession');
const attemptSessionModel = require('../models/redis/AttemptSession');
const paymentModel = require('../models/mongo/Payment');

async function create(_ctx) {
  let now = new Date();
	let session = {
		data: {
      cpnr: _ctx.params.ccode + now.getFullYear() + (now.getMonth() + 1),      
      cochaCode: _ctx.params.ccode,
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
      infants: _ctx.params.infant
    },
		attempts: {}
	};

  var payment = new paymentModel.model({
    cpnr:session.data.cpnr,
    xpnr:session.data.cochaCode,
    total:session.data.price,
    ttl:Koa.config.mongoConf.ttlCron,
    email:session.data.contact
  });
  payment = await paymentModel.save(payment);
  let sessionId = payment._id;
  
  await paymentSessionModel.setPaymentSession(sessionId, session);
  return sessionId; 
}

async function get(_ctx) {
  return await paymentSessionModel.getPaymentSession(_ctx.params.paymentSessionCode);
}

async function remove(_ctx) {
  await attemptSessionModel.delAttemptSession(_ctx.params.paymentSessionCode)
  return await paymentSessionModel.deletePaymentSession(_ctx.params.paymentSessionCode);
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
