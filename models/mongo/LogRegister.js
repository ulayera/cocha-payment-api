'use strict';
/* jshint strict: false, esversion: 6 */

const mongoose = require('mongoose');
const schema = mongoose.Schema;

/**
 * Schema
 */
let logRegisterSchema = new schema({
  trackId: {
    type: String,
    default: ''
  },
  flowId: {
    type: String,
    default: ''
  },
  functionSource: {
    type: String,
    required: true,
    trim: true
  },
  dataSource: {
    type: String,
    default: 'process',
    enum: ['request', 'cache', 'db', 'process']
  },
  serviceContext: {
    type: String,
    required: true,
    trim: true
  },
  serviceName: {
    type: String,
    default: '',
    trim: true
  },
  serviceUrl: {
    type: String,
    default: '',
    trim: true
  },
  success: {
    type: Boolean,
    required: true
  },
  message: {
    type: String,
    default: '',
    trim: true
  },
  sessionData: {
    type: Object,
    default: {}
  },
  processExtraData: {
    type: Object,
    default: {}
  },
  processRequest: {
    type: String,
    set: preProcessData,
  },
  processResponse: {
    type: String,
    set: preProcessData,
  },
  processTime: {
    type: Number,
    default: 0
  },
  level: {
    type: String,
    default: 'debug',
    enum: ['error', 'warn', 'debug', 'info', 'verbose']
  },
  registerDate : {
    type: Date,
    default: Date.now()
  },
  active: {
    type: Boolean,
    default: true
  }
});

function preProcessData(_data) {
  if (!_data) {
    return '';
  } else
  if (typeof _data === 'string') {
    return _data;
  } else
  if (typeof _data === 'object') {
    return JSON.stringify(_data);
  } else {
    return String(_data);
  }
}

/**
 * Module Exports
 */
module.exports = mongoose.model('LogRegister', logRegisterSchema, 'logRegister');