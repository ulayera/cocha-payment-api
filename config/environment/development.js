/*jshint esversion: 6 */

module.exports = {
	path: {
	},
	log: {
		level: 'verbose',
		external: false
	},
	crons: {
		enabled: false
	},
	redisConf: {
		host: process.env.REDIS_HOST || '127.0.0.1',
		port: parseInt(process.env.REDIS_PORT) || 6379,
		db: parseInt(process.env.REDIS_DB) || 0,
		expire: 60 * 60 * 24 // Seconds -> 24h
	},
	mysqlConf: {
		host: process.env.MYSQL_HOST || '192.168.254.162',
		port: parseInt(process.env.MYSQL_PORT) || 3306,
		database: 'expackage',
		username: process.env.MYSQL_USER || 'search-digital',
		password: process.env.MYSQL_PASS || 'c0ch4.D1g1t4l',
		// insecureAuth: true
	}
};