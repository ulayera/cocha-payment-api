var mongoose = require('mongoose');

var schema = new mongoose.Schema(
{
  products: [{
    ccode : {type : String},
    paymentSrc : {type : String},
    title : {type : String},
    clpPrice : {type : Number},
    origin : {type : String},
    destination : {type : String},
    departureDate : {type : Date},
    returningDate : {type : Date},
    contactEmail : {type : String},
    wappOkUrl : {type : String},
    wappErrorUrl : {type : String},
    totalRooms : {type : Number},
    adult : {type : Number},
    child : {type : Number},
    infant : {type : Number}
  }]
});


async function getBySessionXpnr(_id,_xpnr)
{
  return await this.get({'_id':_id,'xpnr':_xpnr});
}


async function get(_id) {
  let query;
  if (typeof _id === 'object') {
    query = _id;
  } else {
    query = {
      '_id': _id
    };
  }
  return new Promise((resolve, reject) => {
    this.model.findOne(query, 'products _id _v', function(
      err, payment) {
      if (err) {
        Koa.log.error(err);
        reject({
          msg: JSON.stringify(err),
          code: 'UberPaymentError',
          status: 500
        });
      } else {
        if (!payment) {
          Koa.log.error(err);
          reject({
            msg: JSON.stringify(err),
            code: 'UberPaymentNotFound',
            status: 404,
            params: JSON.stringify(_id)
          });
        } else {
          resolve(payment);
        }
      }
    })
  });
}


async function getAllBy(_id){
  let query;
  if(typeof _id === 'object'){
    query = _id;
  } else {
    query = {'_id':_id};
  }
  return new Promise((resolve, reject) => {
    this.model.find(query, function (err, payments) {
      if (err) {
        Koa.log.error(err);
        reject({
          msg: JSON.stringify(err),
          code: 'UberPaymentError',
          status:500
        });
      } else {
        resolve(payments);
      }
    })
  });
}

async function save(_object){
  var query = {'_id':_object._id};
  return new Promise((resolve, reject) => {
    this.model.findOneAndUpdate(query, _object, {new:true,upsert:true,passRawResult:true}, function(err, doc, raw){
      if (err) {
        Koa.log.error(err);
        reject({
          msg: JSON.stringify(err),
          code: 'RegisterUberPaymentError',
          status:500
        });
      } else {
        resolve(doc);
      }
    });
  });
}



module.exports = {
  model:mongoose.model('UberPayment', schema, 'uberPayment'),
  getBySessionXpnr:getBySessionXpnr,
  get:get,
  save:save,
  getAllBy:getAllBy
}