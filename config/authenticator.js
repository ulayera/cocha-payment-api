'use strict';
/* jshint strict: false, esversion: 6 */

const userSessionModel = require('../models/redis/UserSession');

module.exports = {
	intentionStrategy: async(_headers, _params) => {
		if (_headers.paymentintention) {
			return {
				sessionData: {
					trackId: _headers.trackid,
					flowId: _headers.flowid,
					paymentIntentionId: _headers.paymentintention
				}
			};
		} else {
			return null;
		}
	},
	paymentIntentionStrategy: async(_headers, _params) => {
		if (_headers.paymentintention) {
			try {
				let userSession = await userSessionModel.getUserSession(_headers.paymentintention);
				return {
					type: userSession.status,
					sessionData: {
						trackId: _headers.trackid,
						flowId: _headers.flowid,
						paymentIntentionId: _headers.paymentintention,
						userSessionData: userSession.data
					}
				};
			} catch(err) {
				Koa.log.error(err);
				return null;
			}
		} else {
			return null;
		}
	}
};
