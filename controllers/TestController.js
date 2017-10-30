'use strict';
/* jshint strict: false, esversion: 6 */

async function test(ctx) {
	ctx.body = 'Test complete!!'
}

module.exports = {
	test: test,
};
