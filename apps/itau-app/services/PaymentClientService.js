var request = require("request");

var options = {
  headers:
    {
      'Content-Type': 'application/json'
    },
  json: true
};


async function getCharge(obj) {
  options.url = Koa.config.path.local.charges.replace(':sessionId', obj.sessionId) + obj.chargeId;
  return await new Promise((resolve, reject) => {
    request.get(options, function (error, response, body) {
      if (error) reject(error);
      resolve(body);
    });
  });
}

async function postCharges(obj) {
  options.url = Koa.config.path.local.charges.replace(':sessionId', obj.sessionId);
  console.log("PaymentClientService.postCharges() -> " + options.url);
  options.body = {
    method: obj.method,
    amount: obj.amount
  };
  return await new Promise((resolve, reject) => {
    request.post(options, function (error, response, body) {
      if (error) reject(error);
      resolve(body);
    });
  });
}

module.exports = {
  postCharges: postCharges,
  getCharge: getCharge,
};
