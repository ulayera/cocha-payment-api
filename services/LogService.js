'use strict';
/* jshint strict: false, esversion: 6 */

const logRegisterModel = require('../models/mongo/LogRegister');

async function logCallToService(_logObj, _super) {
	let logRegister = new logRegisterModel({
		trackId: _logObj.trackId,
		flowId: _logObj.flowId,
		functionSource: _logObj.function,
		dataSource: _logObj.dataSource,
		serviceContext: _logObj.serviceContext,
		serviceName: _logObj.serviceName,
		serviceUrl: _logObj.serviceUrl,
		success: _logObj.success,
		message: _logObj.msg,
		sessionData: _logObj.sessionData,
		processExtraData: {
			method: _logObj.method,
			headers: _logObj.headers,
			remoteServer: _logObj.remoteServer
		},
		processRequest: _logObj.params,
		processResponse: _logObj.data,
		processTime: _logObj.responseTime,
		level: _logObj.level,
	});
	await logRegister.save();
	// _super(_logObj); // Log normal de "External services"
}

module.exports = {
	logCallToService: logCallToService
};