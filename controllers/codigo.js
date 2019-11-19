'use strict'
var Codigo = require('../models/codigo');
var path = require('path');
var fs  = require('fs');
/***DETALLE****/
// Estado 2 => Se genero el codigo y hay que chequear la transaccion
// Estado 1 => Se envio el codigo al correo
// Estado 0 => EL usuario ingreso el codigo
/*****Almacenar la captura de transaccion***/
function saveCodigo (req, res)  {
    var params = req.body;
    if (params.correoPeticion) {
        var codigo = new Codigo();
        codigo.correo_peticion = params.correoPeticion;
        codigo.descripcion = params.descripcion;
        codigo.estado = 2;
        codigo.tipo = 'T';
        codigo.code = codeAleatorio();
        codigo.save((err, codeStored)=>{
           // if(err) res.status(500).send( {message:'Error al generar el codigo', status:9});
           if(err) return res.status(500).send({message:'Error a; guardar la aplicaion'});
           if(!codeStored) return res.status(404).send({message:'La publicacion NO ha sido guardada'});
           return res.send({message:codeStored, status:1});
   
        });
    } 
}

function codeAleatorio(){
    var caracteres = "abcdefghijkmnpqrtuvwxyz12346789";
    var contrasena = "";
    for (let i=0; i<6; i++)
    contrasena +=caracteres.charAt(Math.floor(Math.random()*caracteres.length)); 
    return contrasena; 
    }


/**Subir imagen***/
function uploadImagePay(req, res){
    var payId = req.params.id;
    if(req.files){
        var file_path = req.files.image.path;
        var file_split = file_path.split('\\');
        var file_name = file_split[2];
        var ext_split = file_name.split('\.');
        var file_ext = ext_split[1];

        if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'gif' || file_ext == 'jpeg' ||file_ext == 'PNG' || file_ext == 'JPG' || file_ext == 'GIF' || file_ext == 'JPEG' ){
            Codigo.findOne({'_id': payId}).exec((err, publicationStore) =>{
                if(publicationStore){
                    // Actualizar documento de la publication
                    Codigo.findByIdAndUpdate(payId, {file:file_name}, 
                        {new: true},
                        (err, payUpdated) =>{
                            if(err) return res.status(500).send({message:'No tienes permiso para actualizar los datos del usuario',status:5})
                            if(!payUpdated) return res.status(404).send({message:'No se ha podido actualizar el usuario',status:2});
                    
                            return res.status(200).send({message:payUpdated, status:1});
                        })
                }else{
                    return removeFilesOfUploads(res, file_path,'No tienes permisos para actualizar');
                }
            });

        }else{
            return removeFilesOfUploads(res, file_path, 'Extension no valida')
        }
    }else{
        return res.status(200).send({message:'No se han subido imagenes', status:6});
    }
}

function removeFilesOfUploads(res, file_path, message){
    fs.unlink(file_path, (err)=>{
        return res.status(200).send({message:message, status:2});
    });
}

module.exports = {
    saveCodigo,
    uploadImagePay
}