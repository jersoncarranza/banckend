'use strict';
var bcrypt = require('bcrypt-nodejs');
var mongoosePaginate = require('mongoose-pagination');
var fs = require('fs');
var path = require('path');
var User = require('../models/user');
var Codigo = require('../models/codigo');
var Follow = require('../models/follow');
var Entidade = require('../models/entidade');
var Publication = require('../models/publication');
var jwt  = require('../services/jwt');
var moment = require('moment');

    function home (req, res)  {
        res.status(200).send({   message:'Accion de pruebas' });
    };

    function pruebas(req, res){
        res.status(200).send({
        message:'Accion de pruebas en el servidor'
        })
    };
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
            user.estado   = 1;
            //
            User.find({ $or: [
                {email: user.email.toLowerCase()}
            ]}).exec((err, users) => {
                if(err) return res.status(500).send({message:'Error de la peticion', status:2});
                if(users && users.length >= 1){
                    return res.status(200).send({
                        message:'Este correo ya existe', status:4});
                }else{  
                    
                    FindEntidad(user.email).then((value)=>{
                        /**Comprueba si es el dominio es estuandiantil**/
                        if (value.count == 1 ) {
                            bcrypt.hash(params.password, null, null, (err, hash)=> {
                                user.password = hash;
                                user.entidad = value.data._id;
                                saveUserEstudiante(user).then((value) => {
                                    return res.status(200).send({
                                        user: value.data,
                                        status: value.status //value.status
                                    });
                                }); 
                            });
                        }else{
                            /***** Usuarios Normales hombre o mujer*/
                            verifyCode(user.codigo,function(count){
                                if(count >= 1){
                                    bcrypt.hash(params.password, null, null, (err, hash)=> {
                                        user.password = hash;
                                        saveUserEstudiante(user).then((value) => {
                                            return res.status(200).send({
                                                user: value.data,
                                                status: value.status
                                            });
                                        });
                                    });
                                }else{
                                    res.status(200).send({user: "Ese codigo no existe", status:7});
                                }
                            });
                            ///****/ */
                        }
                    })
                    /***Usuarios normales ****/
                    /*if (user.genero == 'H') {//Almacen cuando sea Hombre
                        verifyCode(user.codigo,function(count){
                            if(count >= 1){
                                bcrypt.hash(params.password, null, null, (err, hash)=> {
                                    user.password = hash;
                                    saveUserEstudiante(user).then((value) => {
                                        return res.status(200).send({
                                            user: value.data,
                                            status: value.status
                                        });
                                    });
                                });
                            }else{
                                res.status(200).send({user: "Ese codigo no existe", status:7});
                            }
                        });
                    }else{// Almacena cuando sea Mujer         
                        bcrypt.hash(params.password, null, null, (err, hash)=> {
                            user.password = hash;
                            saveUserEstudiante(user).then((value) => {
                                return res.status(200).send({
                                    user: value.data,
                                    status: value.status //value.status
                                });
                            });
                        });

                    }
                    */
                    /***Usuario normales *****/
                }
            });
            }else{
                res.status(200).send({
                    message:'Envia todos los campos necesarios', status:8
                });
            }
        }
    
        // Estado 1 => El usuario ya lo esta utlizando
    // Estado 3 => EL se genero el codigo
    async function verifyCode(codigo, callback){
           let query ={'code':codigo ,'estado':1, 'enabled':true};
           let set   = {$set:{'estado':0 , 'date':moment().unix(), 'enabled':false}}
        const result = await Codigo.update(query, set).exec((err , res)=>{
            if(err) return res.status(500).send({message: 'Error al comprobar el seguimiento CU-M4-2', status:5});
            let vres = res.nModified; 
            callback(vres);
            //WriteResult({ "nMatched" : 3, "nUpserted" : 0, "nModified" : 3 })
            //return res.status(200).send({vres});
        });
    }
   

//M2 Login
function loginUser(req, res){
    var params = req.body;
    var email = params.email;
    var password = params.password;
    User.findOne({email:email}, (err, user)=>{
        if(err) return res.status(500).send({message:'Error en la peticion'});
        if(user){
            //////
            bcrypt.compare(password, user.password, (err,check)=>{
                if(check){
                
                    if (user.estado == 1) { //Chequear si esta activado el usuario 1 activado; 
                        if(params.gettoken){
                            user.password = undefined;
                            return res.status(200).send({
                                token :  jwt.createToken(user),
                                user:user,
                                status:1,
                                message:'ok'
                            });
                        }else{
                            //devolver datos de usuario
                            user.password = undefined;
                            return res.status(200).send({user,status:1,message:'ok'});
                        }
                    }else{return res.status(200).send({message:'El usuario esta desactivado', status:0,message:'ok'}) }

                }else{ 
                    return res.status(200).send({message:'El usuario no ha podido la clave', status:2,message:'ok'})
            
                }
            });
            /////////
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
         return res.status(200).send({
                user,
                following: value.following,
                followed: value.followed
            });
        });
    });
}
//Metodo Async 
async function followThisUser(identity_user_id, user_id){

   var following = await Follow.findOne({"user":identity_user_id, "followed":user_id},function(err,follow){
      return follow;
    });

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
    var genero = req.user.genero; 
    var role   = req.user.role;
    var page = 1;
    if(req.params.page){
        page= req.params.page;
    }
    
    var itemsPerPage = 5;
    if(role == 'ADMIN'){
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
    };
    
    let query;
    if(genero == 'H'){
        query ={'genero':'M'};
    }else{
        query ={'genero':'H'};
    };
        User.find(query).sort('_id').paginate(page, itemsPerPage,(err, users, total)=>{
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
        
        var file_split = file_path.split('\\');

        var file_name = file_split[2];
        
        var ext_split = file_name.split('\.');
        
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

            return res.status(200).send({message:'No existe la imagen'});
        }
    })
}

//Registar Estudiante
async function saveUserEstudiante(User) {//Los match que le dio like el usuario (Con el fin que no se repita)
    let saveUser =await User
        .save()
        .then(savedObj => {
            if (savedObj) { savedObj.someProperty = null;
                var data ={
                    data : savedObj,
                    status:1
                };
                return Promise.resolve(data);
            } else {    var data ={
                        data : error,
                        status:9
            }
            return Promise.reject(data);
            }
        });
       return Promise.resolve(saveUser);
    }
 //  Buscar entidades Entidade Universidades
 async function FindEntidad(mail) {
    var respuesta = mail.split("@");
    var dominio   = respuesta[1];
    var query = {'dominio':dominio};
    var data ;
    var findEntity = await Entidade.findOne(query)
    .exec()
    .then((resultEntity) => { 
        if(resultEntity){
            data = {
                data:resultEntity,
                count:1
            }
        }else{
            data = {
                data:resultEntity,
                count:0
            } 
        }
        return Promise.resolve(data);
    })
    .catch((err) => { return handleError(err);    });
    return Promise.resolve(findEntity);
    }
/// Buscar Usuario por correo
async function FindUsuarioCorreo(email){
    var query = {email: email.toLowerCase()};
    var countUser = User.countDocuments(query)
    .exec()
    .then((resultCountUsers) => {  return Promise.resolve(resultCountUsers);})
    .catch((err) => { return handleError(err);    });
    return Promise.resolve(countUser);
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