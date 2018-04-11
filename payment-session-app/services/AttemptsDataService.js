const Attempt = require('../models/Attempt');

async function save(attempt) {
  let _object = Attempt.model(attempt);
  let query = {'_id': _object._id};
  return new Promise((resolve, reject) => {
    Attempt.model.findOneAndUpdate(query, _object, {
      new: true,
      upsert: true,
      passRawResult: true,
      fields: '-__v'
    }, function (err, doc, raw) {
      if (err) {
        Koa.log.error(err);
        reject({
          msg: JSON.stringify(err),
          code: 'SaveAttemptError',
          status: 500
        });
      } else {
        resolve(doc);
      }
    });
  });
}

async function get(sessionId, _id) {
  let query;
  if (typeof _id === 'object') {
    query = _id;
  } else {
    query = {
      '_id': _id
    };
  }
  return new Promise((resolve, reject) => {
    Attempt.model.findOne(query, '-__v', function (err, attempt) {
      if (err) {
        Koa.log.error(err);
        reject({
          msg: JSON.stringify(err),
          code: 'AttemptError',
          status: 500
        });
      } else {
        if (!attempt || attempt.sessionId !== sessionId) {
          Koa.log.error(err);
          reject({
            msg: JSON.stringify(err),
            code: 'NoAttemptsFound',
            status: 404,
            params: JSON.stringify(_id)
          });
        } else {
          resolve(attempt);
        }
      }
    })
  });
}

module.exports = {
  save : save,
  get : get,
};