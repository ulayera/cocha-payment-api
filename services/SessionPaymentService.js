'use strict';
/* jshint strict: false, esversion: 6 */

const paymentSessionModel = require('../models/redis/PaymentSession');
const attemptSessionModel = require('../models/redis/AttemptSession');

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
  let sessionId = 'algotemporal'; //Generado por MongoDB

  await paymentSessionModel.setPaymentSession(sessionId, session);
  return sessionId; 
}

async function get(_ctx) {
  return await paymentSessionModel.getPaymentSession(_ctx.params.paymentSessionCode);
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
  let attemptSessionData = await attemptSessionModel.getAttemptSession(_ctx.params.paymentSessionCode);
  if (!attemptSessionData || attemptSessionData.attemptId !== _ctx.authSession.paymentIntentionId) {
    throw {
      msg: 'Session attempt is not the same',
      code: 'DifferentSessionError'
    };
  }
  await attemptSessionModel.setAttemptSession(_ctx.params.paymentSessionCode, {attemptId: _ctx.authSession.paymentIntentionId});
  return true;
}

/*

function isValidAttempt(_sessionId, _attemptId, _callback) {
	redisService.get('lastsession-attempt:' + _sessionId, function(errAtt, resultAtt) {
		logDb({
			attempt: _attemptId,
			err: errAtt,
			result: resultAtt,
		}, 'valid-session', _sessionId);
		if (!resultAtt || resultAtt.attemptId !== _attemptId) {
			errAtt = {
				msg: 'Session attempt is not the same',
				code: 'DifferentSessionError'
			};
			_callback(errAtt, null);
		} else {
			redisService.set('lastsession-attempt:' + _sessionId, {attemptId: _attemptId}, 300, function(errAtt, resultAtt) {
				_callback(null, true);
			});
		}
	});
}
*/

module.exports = {
	create: create,
	get: get,
	isValidNewAttempt: isValidNewAttempt,
	addAttempt: addAttempt,
	isValidAttempt: isValidAttempt	
};

function cleanRut(_rut) {
	return _rut.toString()
		.replace(new RegExp('\\.', 'g'), '')
		.replace("-", "");
}
