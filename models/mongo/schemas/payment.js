var mongoose = require('../../../config/mongooseDatasource').mongoose
module.exports = new mongoose.Schema({
    name: {type: String},
    age: {type: Number}
})