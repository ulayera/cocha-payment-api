
function calculateSession(session) {
  _.each(session.products, (p) => {
    if (!p.total) {
      p.total = _.sumBy(p.amounts, (a)=>{return a.value});
    }
    p.totalPaid = _.sumBy(p.amounts, (a)=>{return (a.isPaid) ? a.value : 0});
  });
  if (!session.total) {
    session.total = _.sumBy(session.products, (p)=>{return p.total});
  }
  session.totalPaid = _.sumBy(session.products, (p)=>{return p.totalPaid});
  session.status = (session.total === session.totalPaid) ? Koa.config.states.paid : Koa.config.states.pending ;
  return session;
}

function validateSession(session) {
  let errors = [];
  function validateField(name, value, typeFn, isMandatory) {
    if (value && !typeFn(value) || (isMandatory && _.isNull(value))) {
      errors.push(`Parameter '${name}' is invalid: ${value}`);
    }
  }
  validateField('session.successUrl', session.successUrl, _.isString, true);
  validateField('session.errorUrl',   session.errorUrl,   _.isString, true);
  validateField('session.name',       session.name,       _.isString, true);
  validateField('session.mail',       session.mail,       _.isString, true);
  validateField('session.source',     session.source,     _.isString, true);
  validateField('session.products',   session.products,   _.isArray,  true);
  _.each(session.products, (p) => {
    validateField('p.cpnr',   p.cpnr,   _.isString,  true);
    validateField('p.total',   p.total,   _.isNumber,  false);
    validateField('p.currency',   p.currency,   _.isString,  false);
    validateField('p.amounts',   p.amounts,   _.isArray,  true);
    if (!p.currency || !_.isString(p.currency)) {
      p.currency = 'CLP';
    }
    _.each(p.amounts, (a) => {
      validateField('a.name',   a.name,   _.isString,  true);
      validateField('a.value',   a.value,   _.isNumber,  true);
      validateField('a.currency',   a.currency,   _.isString,  false);
      if (!a.currency || !_.isString(a.currency)) {
        a.currency = 'CLP';
      }
    });
  });
  session.status = Koa.config.states.created;
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
    isValid : true,
    reason : ''
  };
  //validate mandatory fields
  if (!attempt.amountId && !attempt.amount && attempt.amount <= 0){
    result.isValid = false;
    result.reason = 'You must specify either an amount or an amountId';
    return result;
  } else if (!attempt.method || !attempt.type) {
    result.isValid = false;
    result.reason = 'You must specify a payment method and it´s type';
    return result;
  } else if (!attempt.productId) {
    result.isValid = false;
    result.reason = 'You must specify the productId of the product you want to pay';
    return result;
  }
  //completes data structure
  let product = _.chain(session.products).filter((x)=> { return x._id.toString() === attempt.productId.toString() }).first().value();
  //more validations
  if (!product) {
    result.isValid = false;
    result.reason = 'Specified Product do not exists';
    return result;
  }
  //validates if amounts are sent correctly
  if (_.isString(product.amountsType) && !_.isEmpty(product.amountsType) &&
      ( (product.amountsType === 'free' && !attempt.amount) ||
        (product.amountsType === 'fixed' && (!attempt.amountId)))) {
    result.isValid = false;
    result.reason = 'Chosen amount type (fixed amounts or free amounts) and sent amount are incorrect';
    return result;
  }
  //completes data structure
  if (!product.amountsType) {
    product.amountsType = (attempt.amountId) ? 'fixed' : 'free';
  }
  if (attempt.amount && !attempt.currency) {
    attempt.currency = 'CLP';
  }
  if (product.amountsType === 'fixed' && _.isNull(_.chain(product.amounts).filter((x)=> { return x._id.toString() === attempt.amountId.toString() }).first().value())) {
    result.isValid = false;
    result.reason = 'Chosen amount (amountId) to pay do not exists';
    return result;
  }
  if (product.amountsType === 'free' && product.totalPaid+attempt.amount >= ) {

  }

  result.attempt = attempt;
  return result;
}

module.exports = {
  calculateSession : calculateSession,
  validateSession : validateSession,
  validateNewAttempt : validateNewAttempt,
};