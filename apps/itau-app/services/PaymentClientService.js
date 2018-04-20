var request = require("request");

var options = {
  method: 'POST',
  headers:
    {
      'Content-Type': 'application/json'
    },
  json: true
};

async function postCharges(obj) {
  options.url = Koa.config.path.local.charges.replace(':sessionId', obj.sessionId);
  options.body = {
    method: obj.method,
    amount: obj.amount
  };
  return await new Promise((resolve, reject) => {
    request(options, function (error, response, body) {
      if (error) reject(error);
      resolve(body);
    });
  });
}

module.exports = {
  postCharges: postCharges,
};
