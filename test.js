let _ = require('lodash');
let mongoose = require('mongoose');

let schema = new mongoose.Schema({
  phoneNumber: String,
  email: String,
  lastName: String,
  name: String
});
let Prueba = mongoose.model('Prueba', schema, 'prueba');

let a = {
  phoneNumber: '123',
  email: 'a@a.com',
  lastName: 'ln',
  name: 'n'
};
let b = {
  lastName: 'ln',
  email: 'a@a.com',
  phoneNumber: '123',
  name: 'n'
};
let bMongo = Prueba(b);
let bToObject = bMongo.toObject();

console.log("Raw: " + _.isEqual(a,b));
console.log("Model: " + _.isEqual(a,bMongo));
console.log("Model.toObject(): " + _.isEqual(a,bToObject));
delete bToObject._id;
console.log("Model.toObject() after deleting _id: " + _.isEqual(a,bToObject));