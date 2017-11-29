'use strict';
/* jshint strict: false, esversion: 6 */

const erpService = require('../services/ErpService');


async function assignTransaction(ctx){
	try{
		let result = await erpService.assignTransaction(ctx.params.sessionToken,ctx.params.cpnr,ctx.params.negocio);
		ctx.status = 200;
		ctx.body = result;
	} catch (err) {
		ctx.status = err.status || 500;
		let detail = ((typeof err.message === 'object') ? err.message : JSON.stringify(err));
		if(err.code === 'PaymentNotFound'){
			throw {
				status:ctx.status,
				message:{
					 code:"01"
					,msg:"CPNR NO ENCONTRADO"
					,detail:detail
				}				
			};
		} else if (err.code === 'BusinessAlreadyAssigned') {
			throw {
				status:ctx.status,
				message:{
					 code:"02"
					,msg:"NEGOCIO YA ASIGNADO"
					,business:err.business || ''
				}
			};
		} else {
			throw {
				status:500,
				message:{
					 code:"03"
					,msg:"ERROR INTERNO"
					,detail:detail
				}
			};			
		}
	}
}

module.exports = {
	assignTransaction: assignTransaction
};