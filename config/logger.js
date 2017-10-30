'use strict';
/* jshint strict: false, esversion: 6 */

let sumologic = require('cocha-logger-services')('flight+hotel');

let originalStackTrace;
function getStack() {
	let errorAux, stack;
	originalStackTrace = Error.prepareStackTrace;
	Error.prepareStackTrace = (something, stack) => {return stack;};
	errorAux = new Error;
	Error.captureStackTrace(errorAux, Function.caller);
	stack = errorAux.stack[3];
	Error.prepareStackTrace = originalStackTrace;

	return stack;
}

function getLogTrace() {
	let stack = getStack();
	return '[' + stack.getFileName() + ':' + stack.getLineNumber() + ']' + ((stack.getFunctionName())? '[' + stack.getFunctionName() + ']' : '');
}

function loadExternalLog(_message) {
	let stack = getStack();
	_message.function = ((stack.getFunctionName())? stack.getFunctionName() + ' ': '') + '[' + stack.getFileName().replace(/^.*\\/g,'') + ':' + stack.getLineNumber() + ']';
	return _message;
}

module.exports = (() => {
	let level = Koa.config.log.level;
	let externalLog = Koa.config.log.external;

	switch(level) {
		case 'silent': level = 0; break;
		case 'error': level = 1; break;
		case 'warn': level = 2; break;
		case 'debug': level = 3; break;
		case 'info': level = 4; break;
		case 'verbose': level = 5; break;
		default: level = 6;
	}

	let createCommonLog = function (_prefix, _color) {
		return function () {
			[].unshift.call(arguments, _color, _prefix + getLogTrace() + ':', '\x1b[0m');
			console.log.apply(null, arguments);
		};
	};

	let createSumoLog = function (_prefix) {
		return function (_message, _id) {
			if (typeof _message !== 'object') {
				_message = {msg: _message};
			}
			_message.level = _prefix;
			_message.sessionKey = _id;
			_message = loadExternalLog(_message);

			sumologic.log(_prefix, _message);
		};
	};

	return {
		error: (level > 0)? createCommonLog('[ERROR]', '\x1b[31m') : () => {}, 
		warn: (level > 1)? createCommonLog('[WARN]', '\x1b[33m') : () => {},
		debug: (level > 2)? createCommonLog('[DEBUG]', '\x1b[34m') : () => {},
		info: (level > 3)? createCommonLog('[INFO]', '\x1b[32m') : () => {},
		verbose: (level > 4)? createCommonLog('[VERBOSE]', '\x1b[36m') : () => {},
		silly: (level > 5)? createCommonLog('[SILLY]', '\x1b[35m') : () => {},
		errorSL: (externalLog && level > 0)? createSumoLog('error') : () => {}, 
		warnSL: (externalLog && level > 1)? createSumoLog('warn') : () => {},
		debugSL: (externalLog && level > 2)? createSumoLog('debug') : () => {},
		infoSL: (externalLog && level > 3)? createSumoLog('info') : () => {},
		verboseSL: (externalLog && level > 4)? createSumoLog('verbose') : () => {},
		sillySL: (externalLog && level > 5)? createSumoLog('silly') : () => {}
	};
})();