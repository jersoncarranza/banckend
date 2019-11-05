'use strict'
var path = require('path');
var fs  = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var Publication = require('../models/publication');
var User = require('../models/user');
var Follow = require('../models/follow');
var mongoose = require('mongoose'); 
var ObjectId = require('mongodb').ObjectId; 
function probando(req, res){
    res.status(200).send({
        message:"hola desde el Controlador de Publicaciones"
    });
}

function savePublication(req,res){

    var params = req.body;
    var publication =  new Publication();

    if(!params.text) return res.status(200).send({message:'Debes enviar un texto'});
    var publication = new Publication();
    publication.text = params.text;
    publication.file = 'null';
    publication.user = req.user.sub;
    publication.created_at = moment().unix();

    publication.save((err, publicationStored) =>{
        if(err) return res.status(500).send({message:'Error a; guardar la aplicaion'});
        if(!publicationStored) return res.status(404).send({message:'La publicacion NO ha sido guardada'});
        return res.status(200).send({publication:publicationStored});
    })
}

function getPublications(req, res){
    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }
    var itemsPerPage = 4;
    var follows_clean = [];
    Follow.find({"user": req.user.sub}).populate('followed').exec().then((follows)=>{  
        for (let i in follows) {
            follows_clean.push(follows[i].followed._id);
        } 
        follows_clean.push(req.user.sub);
        //    var o_id = ['5d56d6f4d985e368f85265cc','5d56ea3b42145962bc68e55b'];
        //Publication.find({user:o_id}).sort('created_at').populate('user').paginate(page, itemsPerPage,(err, publications, total)=>{
        //Publication.find({user:o_id}).then((err,publications)=>{
        //Publication.find({user:{$in:follows_clean}}).sort('created_at').then(function(publications,err){
            Publication.find({user:{$in:follows_clean}}).sort('-created_at').populate('user').paginate(page, itemsPerPage,(err, publications, total)=>{
            
                if(err) return res.status(404).send({message:'Error devolver publicaciones'+err});
                if(!publications) return res.status(500).send({message:'No hay publicaciones'});
            
                return res.status(200).send( {
                    total_items: total,
                    pages: Math.ceil(total/itemsPerPage),
                    page:page,
                    itemsPerPage:itemsPerPage, 
                    publications
                    }
                )    
            });     
    });    
    //});
}

function getPublicationsUser(req, res){
    
    console.log(req.params.id + ' '+ req.params.page);
    var page = 1;
    var user_id;
    if(req.params.page){
        page = req.params.page;
    }

    //if(req.params.id){
        user_id = req.params.id;
    //}
    var itemsPerPage = 4;

    Publication.find({user:user_id}).sort('-created_at').populate('user').paginate(page, itemsPerPage,(err, publications, total)=>{
        if(err) return res.status(404).send({message:'Error devolver publicaciones'+err});
        if(!publications) return res.status(500).send({message:'No hay publicaciones'});
    
        return res.status(200).send( {
            total_items: total,
            pages: Math.ceil(total/itemsPerPage),
            page:page,
            itemsPerPage:itemsPerPage, 
            publications
            }
        )    
    });     

}

function getPublication(req,res){
    var publicationId = req.params.id;

    Publication.findById(publicationId, (err, publication)=>{
        if(err) return res.status(404).send({message:'Error devolver publicaciones'+err});
        if(!publication) return res.status(500).send({message:'No hay publicaciones'});
        return res.status(200).send({publication})
    });
}


function deletePublication(req,res){
    var publicationId = req.params.id;


    Publication.find({'user':req.user.sub, '_id':publicationId}).remove(err=>{
        if(err) return res.status(500).send({message:'Error al borrar publicaciones'+err});
       // if(!publicationRemoved) return res.status(404).send({message:'Ya no existe esa publicacion'});
        return res.status(200).send({message:'Publicacion eliminada'})
    });
}

function uploadImage(req, res){
    var publicationId = req.params.id;
    console.log(req.files);
    if(req.files){
        var file_path = req.files.image.path;
        var file_split = file_path.split('\\');
        var file_name = file_split[2];
        var ext_split = file_name.split('\.');
        var file_ext = ext_split[1];

        if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'gif' || file_ext == 'jpeg' ){
            
            Publication.findOne({'user':req.user.sub, '_id': publicationId}).exec((err, publication) =>{
                if(publication){
                    // Actualizar documento de la publication
                    Publication.findByIdAndUpdate(publicationId, {file:file_name}, 
                        {new: true},
                        (err, publicationUpdated) =>{
                            if(err) return res.status(500).send({message:'No tienes permiso para actualizar los datos del usuario'})
                            if(!publicationUpdated) return res.status(404).send({message:'No se ha podido actualizar el usuario'});
                    
                            return res.status(200).send({publication:publicationUpdated});
                        })
                }else{
                    return removeFilesOfUploads(res, file_path,'No tienes permioos para actualizar');
                }
            });

      
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
    var path_file  = './uploads/publications/' + image_file;

    fs.exists(path_file, (exists) =>{
        if(exists){
            res.sendFile(path.resolve(path_file));
        }else{
            res.status(200).send({message:'No existe la imagen'});
        }
    })
}


 module.exports  = {
    probando,
    savePublication,
    getPublications,
    getPublicationsUser,
    getPublication,
    deletePublication,
    uploadImage,
    getImageFile
}