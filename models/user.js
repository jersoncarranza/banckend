'use strict';

var mongoose =  require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = Schema ({
    name: String,
    lastname: String,
    nickname: String,
    password: String,
    role:  String,
    image: String,
    email: String,
    codigo: String,
    genero:String,
    estado: Number, // 1 Activo ; 0 Desactivado,
    entidad: {type: Schema.ObjectId, ref:'entidade'}//
});

module.exports = mongoose.model('User', UserSchema);