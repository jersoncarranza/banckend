'use strict'

var mongoose =  require('mongoose');
var Schema = mongoose.Schema;

var CodigoSchema = Schema ({
    code: String,
    tipo: String,
    estado: Number,
    correo: String,
    date: String,
    correo_peticion: String,
    descripcion: String,
    file:String,
    enabled:Boolean
});

module.exports = mongoose.model('Codigo', CodigoSchema);