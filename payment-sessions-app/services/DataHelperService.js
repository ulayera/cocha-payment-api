let uuidGenerator = require('uuid/v4');

function uuid() {
  return uuidGenerator().replace(/-/g, '')
}


function calculateSession(session) {
  _.each(session.products, (p) => {
    if (!p.total) {
      p.total = _.sumBy(p.amounts, (a) => {
        return a.value
      });
    }
    p.totalPaid = _.sumBy(p.amounts, (a) => {
      return (a.isPaid) ? a.value : 0
    });
  });
  if (!session.total) {
    session.total = _.sumBy(session.products, (p) => {
      return p.total
    });
  }
  session.totalPaid = _.sumBy(session.products, (p) => {
    return p.totalPaid
  });
  session.status = (session.total === session.totalPaid) ? Koa.config.states.paid : Koa.config.states.pending;
  return session;
}

function validateSession(session) {
  let errors = [];

  function validateField(name, value, typeFn, isMandatory) {
    if (value && !typeFn(value) || (isMandatory && _.isNull(value))) {
      errors.push(`Parameter '${name}' is invalid: ${value}`);
    }
  }

  if (session._id) {
    errors.push(`You can't set the _id field`);
  }
  validateField('session.successUrl', session.successUrl, _.isString, true);
  validateField('session.errorUrl', session.errorUrl, _.isString, true);
  validateField('session.name', session.name, _.isString, true);
  validateField('session.mail', session.mail, _.isString, true);
  validateField('session.source', session.source, _.isString, true);
  validateField('session.products', session.products, _.isArray, true);
  _.each(session.products, (p) => {
    if (p._id) {
      errors.push(`You can't set the _id field`);
    }
    validateField('p.cpnr', p.cpnr, _.isString, true);
    validateField('p.total', p.total, _.isNumber, false);
    validateField('p.currency', p.currency, _.isString, false);
    validateField('p.amounts', p.amounts, _.isArray, true);
    p.xpnr = p.cpnr + '-' + uuid();
    if (!p.currency || !_.isString(p.currency)) {
      p.currency = 'CLP';
    }
    if (!_.isNull(p.amount) && p.amount > 0) {
      p.totalPaid = 0;
    }
    _.each(p.amounts, (a) => {
      if (a._id) {
        errors.push(`You can't set the _id field`);
      }
      validateField('a.name', a.name, _.isString, true);
      validateField('a.value', a.value, _.isNumber, true);
      validateField('a.currency', a.currency, _.isString, false);
      if (!a.currency || !_.isString(a.currency)) {
        a.currency = 'CLP';
      }
    });
  });
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
  let result = {
    isValid: true,
    reason: ''
  };

  //finds product to pay
  let product;
  if (attempt.productId && !attempt.amountId) {
    product = _.chain(session.products).filter((x) => {
      return x._id.toString() === attempt.productId.toString()
    }).first().value();
  } else {
    product = _.chain(session.products).filter((x) => {
      return _.chain(x.amounts).filter((a) => {
        return a._id.toString() === attempt.amountId;
      }).first().value() != null;
    }).first().value();
  }
  //validates that product exists
  if (!product) {
    result.isValid = false;
    result.reason = 'Specified Product do not exists';
    return result;
  }
  //evaluates product's amount type
  if (!product.amountsType) {
    product.amountsType = (attempt.amountId) ? 'fixed' : 'free';
  }

  switch (product.amountsType) {
    case 'fixed':
      if (!attempt.amountId) {
        result.isValid = false;
        result.reason = 'You must specify the amountId';
        return result;
      } else if (_.isNull(_.chain(product.amounts).filter((x) => {
          return x._id.toString() === attempt.amountId.toString()
        }).first().value())) {
        result.isValid = false;
        result.reason = 'Chosen amount (amountId) to pay do not exists';
        return result;
      }
      let givenFixedAmount = _.chain(product.amounts).filter((a) => {
        return a._id.toString() === attempt.amountId;
      }).first().value();
      attempt.amount = givenFixedAmount.value;
      attempt.currency = (givenFixedAmount.currency) ? givenFixedAmount.currency : 'CLP';
      attempt.productId = product._id;
      break;
    case 'free':
      if (!attempt.amount && attempt.amount <= 0) {
        result.isValid = false;
        result.reason = 'You must specify the amount';
        return result;
      } else if (!attempt.productId) {
        result.isValid = false;
        result.reason = 'You must specify the productId of the product you want to pay';
        return result;
      } else if (product.totalPaid + attempt.amount > product.total) {
        result.isValid = false;
        result.reason = 'selected amount is greater than the remaining';
        return result;
      }
      break;
  }
  //validate mandatory fields
  if (!attempt.method) {
    result.isValid = false;
    result.reason = 'You must specify a payment method';
    return result;
  }
  if (!attempt.currency) {
    attempt.currency = 'CLP';
  }
  attempt.cpnr = product.cpnr;
  attempt.status = Koa.config.states.created;
  result.attempt = attempt;
  result.session = session;
  return result;
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