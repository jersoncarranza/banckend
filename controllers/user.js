'use strict'
var bcrypt = require('bcrypt-nodejs');
var mongoosePaginate = require('mongoose-pagination');
var fs = require('fs');
var path = require('path');

var User = require('../models/user');
var Codigo = require('../models/codigo');
var Follow = require('../models/follow');
var Publication = require('../models/publication');
var jwt  = require('../services/jwt');
var moment = require('moment');

function home (req, res)  {
    res.status(200).send({
        message:'Accion de pruebas'
    });
};

function pruebas(req, res){
    console.log(req.body);
    res.status(200).send({
        message:'Accion de pruebas en el servidor'
    })
};

// 200 ESE USUARIO YA EXISTE
// 500 Error de la peticion
// M1 Registro
function saveUser(req, res){
    var params = req.body;
    var user = new User();
    if(params.name && params.email && params.password){
            user.name = params.name;
            user.lastname = "";
            user.nickname = "";
            user.email    = params.email;
            user.role     = params.role;
            user.codigo   = params.codigo; 
            user.image    = null;
            user.genero   = params.genero; //M:Mujer  ; H:Hombre
            //
            User.find({ $or: [
                {email: user.email.toLowerCase()}
                //, {nickname: user.nickname.toLowerCase()} 
            ]}).exec((err, users) => {
                if(err) return res.status(500).send({message:'Error de la peticion', status:2});
                if(users && users.length >= 1){
                    return res.status(200).send({
                        message:'Este correo ya existe', status:4});
                }else{  
                    
                    if (user.genero == 'H') {
                        verifyCode(user.codigo,function(count){
                            if(count >= 1){
                            //Cifrar la contrasena
                            bcrypt.hash(params.password, null, null, (err, hash)=> {
                                user.password = hash;
                                user.save((err, userStored) => {
                                    if(err) return res.status(500).send(
                                        {message:'Error al guardar el usuario', status:9});
                                    
                                    if(userStored){
                                        res.status(200).send({user: userStored, status:1});
                                    }else{
                                        res.status(200).send({message:'No se ha registrado',status:2});
                                    }
                                });
                            });
                            }else{
                                res.status(200).send({user: "Ese codigo no existe", status:7});
                            }
                            
                        });
                    }else{// Almacena cuando sea Mujer
                        bcrypt.hash(params.password, null, null, (err, hash)=> {
                            user.password = hash;
                            user.save((err, userStored) => {
                                if(err) return res.status(500).send({message:'Error al guardar el usuario', status:9});
                                
                                if(userStored){
                                    res.status(200).send({user: userStored, status:1});
                                }else{
                                    res.status(200).send({message:'No se ha registrado',status:2});
                                }
                            });
                        });
                    }
                }
            });
        
    }else{
        res.status(200).send({
            message:'Envia todos los campos necesarios', status:8
        });
    }
}
//collection.estimatedDocumentCount
       async function verifyCode(codigo, callback){
           let query ={'code':codigo ,'estado':1};
           let set   = {$set:{'estado':0 , 'date':  moment().unix()}}
        const result = await Codigo.update(query, set).exec((err , res)=>{
            if(err) return res.status(500).send({message: 'Error al comprobar el seguimiento CU-M4-2', status:5});
            let vres = res.nModified; 
            callback(vres);
            //WriteResult({ "nMatched" : 3, "nUpserted" : 0, "nModified" : 3 })
            //return res.status(200).send({vres});
        });


/*
        Codigo.find(query).count()
        .exec()
        .then((err, res)=>{
            console.log(res);
        });
*/

        //return codigo + "modificado";
         /*
         Codigo.find({"code":codigo.trim() ,"estado":1},function(err,follow){
            console.log("1 sdsd " +follow)
            callback(follow) ;
          }); */
    }
   
    /*
    async function followThisUser(identity_user_id, user_id){
   /*
   var following = await Follow.findOne({"user":identity_user_id, "followed":user_id})
   .exec()
   .then((err, follows) => {

   })
   .catch((err) => {
       return handleError(err);
   });
   

   var following = await Follow.findOne({"user":identity_user_id, "followed":user_id},function(err,follow){
    return follow;
  });
    
    */
//M2 Login
function loginUser(req, res){
    var params = req.body;
    var email = params.email;
    var password = params.password;
    
    User.findOne({email:email}, (err, user)=>{
        if(err) return res.status(500).send({message:'Error en la peticion'});
        if(user){
            bcrypt.compare(password, user.password, (err,check)=>{
                if(check){
                    
                    if(params.gettoken){
                        /*if(gettoken != null){
                            user.token =  jwt.createToken(user);
                            user = Object.assign(user, {gettoken});
                        }*/
                      //  user = Object.assign(user, {gettoken});
                        //generar y devolver token
                        return res.status(200).send({
                            token :  jwt.createToken(user),
                            user:user
                        });
                    }else{
                        //devolver datos de usuario
                        user.password = undefined;
                        console.log('no hay token');
                        return res.status(200).send({user});
                    }

                    
                }else{
                    return res.status(404).send({message:'El usuario no ha podido'})
                }
            });

        }
    });
}

//M3 Conseguir Datos de un usuarios

function getUser(req,res){
    var userId = req.params.id;
    User.findById(userId, (err, user)=>{
        if(err) return res.status(500).send({message: 'Error de la peticion CU-M4-1'});
        if(!user) return res.status(404).send({message:'El usuario  no existe'});

        followThisUser(req.user.sub, userId).then((value)=>{
            user.password = undefined;

            //console.log('power ' + followed);

            return res.status(200).send({
                user,
                following: value.following,
                followed: value.followed
            });
        });
        /*
        Follow.findOne({"user":req.user.sub, "followed":userId}).exec((err, follow)=>{
            if(err) return res.status(500).send({message: 'Error al comprobar el seguimiento CU-M4-2'});
            return res.status(200).send({user,follow});
        });
        */

        
    });
}
//Metodo Async 
async function followThisUser(identity_user_id, user_id){
   
   // console.log('dep 2 ' + identity_user_id);
   // console.log('dep 3 ' + user_id);
   // var asyFollowed;
    
   /*
   var following = await Follow.findOne({"user":identity_user_id, "followed":user_id})
   .exec()
   .then((err, follows) => {

   })
   .catch((err) => {
       return handleError(err);
   });
   */

   var following = await Follow.findOne({"user":identity_user_id, "followed":user_id},function(err,follow){
      return follow;
    });

   
    //
    /*return follows;
    });
   */

    
    /*var following =   Follow.findOne({"user":identity_user_id, "followed":user_id}).exec((err, follow)=>{
        if(err) return handleError(err);
       console.log(follow + 'follow')
        return follow;
    });*/

    /*
   let query = {"user":identity_user_id, "followed":user_id};
    const result = await Follow.find(query);
     */
    
     /*
    var followed =  Follow.findOne({"user":user_id, "followed":identity_user_id}).exec((err, follow)=>{
        if(err) return handleError(err);
        return follow;
    });
    */
    var followed = await Follow.findOne({"followed":identity_user_id, "user":user_id},function(err,follow){
        return follow;
    });

    return{
        following:following,
        followed:followed
    }
}

// Devolver in listado paginado
function getUsers(req, res){
    var identity_user_id = req.user.sub;
    var page = 1;
    if(req.params.page){
        page= req.params.page;
    }
    var itemsPerPage = 5;

    User.find().sort('_id').paginate(page, itemsPerPage,(err, users, total)=>{
        if(err) return res.status(500).send({message: 'Error de la peticion'});
        if(!users) return res.status(404).send({message:'No hay usuarios disponibles'});
        
        followUserIds(identity_user_id).then((value) => {
            return res.status(200).send({
                users,
                users_following: value.following,
                users_follow_me: value.followed,
                total:total ,
               pages: Math.ceil(total/itemsPerPage)
            });
        });
       
    });
}
async function followUserIds(user_id) {
    var following = await Follow.find({ user: user_id }).select({ _id: 0, __v: 0, user: 0 })
        .exec()
        .then((follows) => {
            var follows_clean = [];
            follows.forEach((follow) => {
                follows_clean.push(follow.followed);
            });
            return follows_clean;
        })
        .catch((err) => {
            return handleError(err);
        });

    var followed = await Follow.find({ followed: user_id }).select({ _id: 0, __v: 0, followed: 0 })
        .exec()
        .then((follows) => {
            var follows_clean = [];
            follows.forEach((follow) => {
                follows_clean.push(follow.user);
            });
            return follows_clean;
        })
        .catch((err) => {
            return handleError(err);
        });
    return {
        following: following,
        followed: followed
    };
}

// El numeros de seguidores y personas que sigo tengo
function getCounters(req, res){
    let userId = req.params.id;
    getCountFollow(userId).then((value) =>{
        return res.status(200).send(value);
    });
}



async function getCountFollow(user_id) {
    var following = await Follow.countDocuments({ user: user_id })
        .exec()
        .then((count) => {
            return count;
        })
        .catch((err) => { return handleError(err); });
 
    var followed = await Follow.countDocuments({ followed: user_id })
        .exec()
        .then((count2) => {
            return count2;
        })
        .catch((err) => { return handleError(err); });
        
    var publications = await Publication.countDocuments({user: user_id})
        .exec()
        .then((count3) => {
            return count3;
        })
        .catch((err) => { return handleError(err); });

    return {
        following: following,
        followed: followed ,
        publications:publications
    }
 
}

// Edicion de datos de usuario
function updateUser(req, res){
   
    var userId= req.params.id;
    var update= req.body;

    // borrar propiedad password
    delete update.password;

    if(userId != req.user.sub){
        return res.status(509).send({message:'no tienes permiso'})
    }

    User.find(
        { $or: [
            {email: update.email.toLowerCase()},
            {nickname : update.nickname.toLowerCase()} 
        ]}
        ).exec((err, users) =>{
        //Cabecera para enviar una sola vez del Cliente
            var user_isset = false;
            users.forEach((user) => { 
                if(user._id != userId) user_isset = true;         
        }); 
      
        if(user_isset){ return res.status(404).send({message:'Error Los datos en uso'});}
       
        //- End Cabecera

        //if(users._id != userId){  res.status(500).send({message:'Los datos ya estan en uso'});
        
        User.findByIdAndUpdate(userId, update,{new:true}, (err, userUpdated) =>{
            if(err) return res.status(505).send({message:'No tienes permiso para actualizar los datos del usuario'});
            if(!userUpdated) return res.status(404).send({message:'No se ha podido actualizar el usuario'});
    
            return res.status(200).send({user:userUpdated});
        });
        //}
    });


}

// Subir archivos de imagen / avatar de usuario
function uploadImage(req, res){
    var userId = req.params.id;

    if(req.files){
        var file_path = req.files.image.path;
        console.log(file_path);
        
        var file_split = file_path.split('\\');

        var file_name = file_split[2];
        console.log(file_name);

        var ext_split = file_name.split('\.');
        console.log(ext_split);

        var file_ext = ext_split[1];

        if(userId != req.user.sub){
            return removeFilesOfUploads(res, file_path, 'No tiene permisos para actualizar');
        }

        if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'gif' || file_ext == 'jpeg' ){
            // Actualizar documento de usuario logueado
            User.findByIdAndUpdate(userId,
                                    {image:file_name},
                                    {new: true},
                                    (err, userUpdated) =>{
                                        if(err) return res.status(500).send({message:'No tienes permiso para actualizar los datos del usuario'})
                                        if(!userUpdated) return res.status(404).send({message:'No se ha podido actualizar el usuario'});
                                
                                        return res.status(200).send({user:userUpdated});
                                    })
        }else{
            return removeFilesOfUploads(res, file_path, 'Extension no valida')
        }


    }else{
        return res.status(200).send({message:'No se han subido imagenes'});
    }
}

function removeFilesOfUploads(res, file_path, message){
    fs.unlink(file_path, (err)=>{
        return res.status(200).send({message:message});
    });
}

//Obtener una imagen
function getImageFile(req, res){
    var image_file = req.params.imageFile;
    var path_file  = './uploads/users/' + image_file;
  
    fs.exists(path_file, (exists) =>{
        if(exists){
        
            return res.sendFile(path.resolve(path_file));
        }else{
            console.log('No exister')
            return res.status(200).send({message:'No existe la imagen'});
        }
    })
}

module.exports = {
    home,
    pruebas,
    saveUser,
    loginUser,
    getUser,
    getUsers,
    getCounters,
    updateUser,
    uploadImage,
    getImageFile
}