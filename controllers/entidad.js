'use strict';
var Entidad = require('../models/entidade');

function getEntidad(req, res){
    let query ={estado:1};
    Entidad.find(query)
    .exec((err, resultEntity)=>{
      //  console.log(resultEntity)
        if(err) return res.status(200).send({message:'Error de la peticion', status:0});
        return res.status(200).send({result:resultEntity,status:1,message:'ok'});
    })
}

module.exports={
    getEntidad
}