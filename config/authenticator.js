'use strict';
/* jshint strict: false, esversion: 6 */

const userSessionModel = require('../models/redis/UserSession');

module.exports = {
	intentionStrategy: async(_headers, _params) => {
		if (_headers.paymentIntention) {
			return {
				sessionData: {
					trackId: _headers.trackid,
					flowId: _headers.flowid,
					paymentIntentionId: _headers.paymentIntention
				}
			};
		} else {
			return null;
		}
	},
	paymentIntentionStrategy: async(_headers, _params) => {
		if (_headers.paymentIntention) {
			try {
				let userSession = await userSessionModel.getUserSession(_headers.paymentIntention);
				return {
					type: userSession.status,
					sessionData: {
						trackId: _headers.trackid,
						flowId: _headers.flowid,
						paymentIntentionId: _headers.paymentIntention,
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
