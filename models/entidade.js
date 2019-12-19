'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var entidadeSchema = Schema({
    _id : String,
    name : String,
    dominio : String,
    estado : Number,
    tipo : String,
    descripcion : String,
    image :String
});

module.exports = mongoose.model('Entidade', entidadeSchema);