'use strict'

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
    genero:String
});

module.exports = mongoose.model('User', UserSchema);