/**
 * Retrieves the available payment methods depending on which are implemented and inclusions/exclusions sent by the
 * caller app.
 * @param ctx expected: { include : [String], exclude: [String] } optional
 * @returns {Promise<void>}
 */
async function getPaymentMethods(ctx) {
  //logic to show or hide some payment methods
  ctx.body = paymentStrategyService.getStrategies();
}

module.exports = {
  getPaymentMethods: getPaymentMethods,
};