'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'clave_secreta';

exports.createToken = function(user){
    var payload = {
        sub: user._id,
        name: user.name,
        lastname: user.lastname,
        nickname: user.nickname,
        email: user.email,
        role: user.role,
        image: user.image,
        genero: user.genero,
        iat:moment().endOf('day').fromNow(),
        //exp:moment().endOf('day').fromNow()
        //iat: moment().unix(),
        exp: moment(moment()).add(1, 'days').unix

     
    };

    return jwt.encode(payload, secret);
}
