'use strict';
/* jshint strict: false, esversion: 6 */

const soap = require('soap'); 

// let clientPayment;
// soap.createClient(Koa.config.path.webpay.setPayment, (err, soapClient) => {
//   if (err) {
//     Koa.log.error(err);
//   } else {
//     clientPayment = soapClient;
//   }
// });
// let clientPaymentStatus;
// soap.createClient(Koa.config.path.webpay.getPaymentStatus, (err, soapClient) => {
//   if (err) {
//     Koa.log.error(err);
//   } else {
//     clientPaymentStatus = soapClient;
//   }
// });

module.exports = (async function() {
  let client = await Promise.all({
    paymentData: new Promise((resolve, reject) => {
      console.log('A01');
      soap.createClient(Koa.config.path.webpay.setPayment, {
        ignoredNamespaces: {
          namespaces: ['targetNamespace', 'typedNamespace'],
          override: true
        }
      },(err, soapClient) => {
        console.log('A01-R');
        if (err) {
          Koa.log.error(err);
          reject(err);
        } else {
          resolve(soapClient);
        }
      });
    }),
    // paymentStatus: new Promise((resolve, reject) => {
    //   console.log('A02');
    //   soap.createClient(Koa.config.path.webpay.getPaymentStatus, (err, soapClient) => {
    //     console.log('A02-R');      
    //     if (err) {
    //       Koa.log.error(err);
    //       reject(err);
    //     } else {
    //       resolve(soapClient);
    //     }
    //   });
    // })
  });

  console.log(client);
})();
// function callSoapService(_wsdlUri, _wsdlMethod, _wsdlParams, _cbThen, _cdCatch) {
// 	function callSoapMethod(client) {
// 		client[_wsdlMethod](_wsdlParams, (err, result) => {
// 			if (err) {
// 				_cbThen(err);
// 			} else {
// 				_cdCatch(result);
// 			}
// 		});
// 	}

// 	if (soapClients[_wsdlUri]) {
// 		callSoapMethod(soapClients[_wsdlUri]);
// 	} else {
// 		soap.createClient(_wsdlUri, (err, soapClient) => {
// 			if (err) {
// 				_cbThen(err);
// 			} else {
// 				soapClients[_wsdlUri] = soapClient;
// 				callSoapMethod(soapClient);
// 			}
// 		});
// 	}
// }

// module.exports = {
//   // getPaymentData: callSoapService,
//   // checkPayment: checkPayment
// };