let uuidGenerator = require('uuid/v4');
let paymentStrategyService = require('./PaymentStrategyService');

function calculateSession(session) {
  if (session.toSplitAmount) {
    session.total = session.toSplitAmount.value + _.sumBy(session.amounts, a => a.value);
  } else {
    session.total = _.sumBy(session.amounts, a => a.value);
  }
  session.totalPaid = _.sumBy(session.amounts, a => (a.isPaid) ? a.value : 0);
  session.status = (session.total === session.totalPaid) ? Koa.config.states.paid : Koa.config.states.pending;
  return session;
}

function validateSession(session) {
  let errors = [];

  function validateField(name, value, typeFn, isRequired) {
    if (value && !typeFn(value) || (isRequired && _.isNull(value))) {
      errors.push(`Parameter '${name}' is invalid: ${value}`);
    }
  }

  if (session._id) {
    errors.push(`You can't set the _id field`);
  }
  validateField('session.wappOkUrl', session.wappOkUrl, _.isString, true);
  validateField('session.wappErrorUrl', session.wappErrorUrl, _.isString, true);
  validateField('session.refCode', session.refCode, _.isString, true);
  validateField('session.business', session.business, _.isString, true);
  validateField('session.name', session.name, _.isString, true);
  validateField('session.mail', session.mail, _.isString, true);
  validateField('session.amounts', session.amounts, _.isArray, true);
  _.each(session.amounts, (a) => {
    if (a._id) {
      errors.push(`You can't set the _id field`);
    }
    validateField('a.label', a.label, _.isString, true);
    validateField('a.value', a.value, _.isNumber, true);
    validateField('a.currency', a.currency, _.isString, false);
    validateField('a.refCode', a.refCode, _.isString, true);
    if (!a.currency || !_.isString(a.currency)) {
      a.currency = 'CLP';
    }
  });
  if (session.amounts.length === 1 && session.amounts[0].isSplittable === true) {
    session.toSplitAmount = {
      label: session.amounts[0].label,
      value: session.amounts[0].value,
      currency: session.amounts[0].currency,
    };
    session.amounts = [];
  }
  if (!session.status) {
    session.status = Koa.config.states.created;
  }
  session.date = new Date();
  if (session.methodsFilter && session.methodsFilter.length > 0) {
    _.each(session.methodsFilter, (mf) => {
      if (paymentStrategyService.PAYMENT_METHODS.indexOf(mf) < 0)
        errors.push(`Payment Method Filter ${mf} is not supported`);
    });
  }
  if (errors.length > 0) {
    throw {
      status: 400,
      message: {
        code: 'ParamsError',
        msg: errors
      }
    };
  }
  return session;
}

function validateNewAttempt(session, attempt) {
  function returnError(str) {
    return {
      isValid: false,
      reason: str
    }
  }
  if (_.isNull(attempt.session) || session.methodsFilter.indexOf(attempt.method) < 0) {
    return returnError('Payment method unavailable');
  } else if (session.toSplitAmount) {
    if (!attempt.amount) {
      return returnError('You need to send an amount:Number');
    } else if (attempt.amount > session.toSplitAmount.value) {
      return returnError('Amount is greater than the remaining');
    }
  } else if (!session.toSplitAmount) {
    if (!attempt.amountId) {
      return returnError('You need to send an amountId:String');
    } else if (attempt.amountId && _.filter(session.amounts, a => a._id.toString() === attempt.amountId).length === 0) {
      return returnError('Could not find given amount');
    }
  }
  return {
    isValid: true,
    reason: ''
  };
}

function validateExistingAttempt(attempt) {
  if (!attempt) {
    throw {
      status: 404,
      message: {
        code: 'AttemptNotFoundError',
        msg: 'Attempt not found'
      }
    };
  }
  return attempt;
}

module.exports = {
  calculateSession: calculateSession,
  validateSession: validateSession,
  validateNewAttempt: validateNewAttempt,
  validateExistingAttempt: validateExistingAttempt,
};