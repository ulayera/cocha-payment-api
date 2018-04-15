const request = require("request");
let baseURL = 'http://localhost:1337';
var options = {
  headers:
    {
      'Content-Type': 'application/json'
    },
  json: true
};


async function startPayment(obj) {
  let resourceUrl = '/setPayment';
  return await new Promise((resolve, reject) => {
      request.post(resourceUrl,
        {
          headers:
            {
              'Content-Type': 'application/json'
            },
          body: obj,
          json: true
        }, function (error, response, body) {
          if (error)
            reject(error);
          resolve(body);
        })
    }
  );
}

async function checkPayment(paymentSessionCode) {
  let resourceUrl = '/statusPayment/:paymentSessionCode/:appCode';
  resourceUrl.replace(':paymentSessionCode', paymentSessionCode);
  resourceUrl.replace(':appCode', 'CochaPayment');
  return await new Promise((resolve, reject) => {
      request.post(resourceUrl,
        {
          headers:
            {
              'Content-Type': 'application/json'
            },
          json: true
        }, function (error, response, body) {
          if (error)
            reject(error);
          resolve(body);
        })
    }
  );
}

module.exports = {
  startPayment: startPayment,
  checkPayment: checkPayment
};