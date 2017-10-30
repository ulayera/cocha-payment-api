/**
 * MysqlDatasource.js
 */

'use strict';
/* jshint strict: false, esversion: 6 */

let DataSource = require('loopback-datasource-juggler').DataSource;
let dataSource = new DataSource('mysql', Koa.config.mysqlConf);

const models = [

];

module.exports = {
	start: () => {
		for (var i = 0; i < models.length; i++) {
			require(models[i]); //Load model			
		}
	},
	define: (_model) => {
		// console.log("DataSource -> Define: " + _model.name);
		return dataSource.define(_model.name, _model.attributes, _model.options);
	}	
};
