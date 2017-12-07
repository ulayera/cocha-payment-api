var mongoose = require('mongoose');

var schema = new mongoose.Schema({
    cpnr: {type: String},
    xpnr: {type: String},
    email: {type: String},
    status: [{
    	id:String
       ,transaction_type:String
       ,currency:String
       ,status:String
       ,date:Date
       ,amount:Number
       ,info:mongoose.Schema.Types.Mixed
    }],
    business:{type: String},
    total:{type: Number},
    ttl:{type: Number},
    state:{type: String},
    processed:{type: Number}
});


async function getBySessionCpnr(_id,_cpnr){
	return await this.get({'_id':_id,'cpnr':_cpnr});
}


async function get(_id){
	let query;
	if(typeof _id === 'object'){
		query = _id;
	} else {
		query = {'_id':_id};		
	}
	return new Promise((resolve, reject) => {
		this.model.findOne(query, 'cpnr xpnr email type status business total ttl state processed _id _v', function (err, payment) {
	  		if (err) {
		        Koa.log.error(err);
				reject({
		          msg: JSON.stringify(err),
		          code: 'PaymentError',
		          status:500
		        });	
	  		} else {
	  			if(!payment){
			        Koa.log.error(err);
					reject({
			          msg: JSON.stringify(err),
			          code: 'PaymentNotFound',
			          status: 404,
			          params: JSON.stringify(_id)
			        });	
	  			}else{
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
		          code: 'PaymentError',
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
		          code: 'RegisterPaymentError',
		          status:500
		        });	
	  		} else {
	  			resolve(doc);
	  		}
		});
	});		
}



module.exports = {
	model:mongoose.model('Payment', schema, 'payment'),
	getBySessionCpnr:getBySessionCpnr,
	get:get,
	save:save,
	getAllBy:getAllBy
}