var mongoose = require('mongoose');

var schema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    cpnr: {type: String},
    xpnr: {type: String},
    email: {type: String},
    status: [{id:String,transaction_type:String,currency:String,status:String,date:Date,amount:Number,info:mongoose.Schema.Types.Mixed}],
    business:{type: String},
    total:{type: Number},
    ttl:{type: Number}
});


async function getByCpnr(_cpnr){
	return await this.get({'cpnr':_cpnr});
}

async function get(_id){
	let query;
	if(typeof _id === 'object'){
		query = _id;
	} else {
		query = {'_id':_id};		
	}
	return new Promise((resolve, reject) => {
		this.model.findOne(query, '_id cpnr xpnr email type status business total ttl', function (err, payment) {
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
	getByCpnr:getByCpnr,
	get:get,	
	save:save
}