'use strict'
var path = require('path');
var mogoosePaginate = require('mongoose-pagination');
var User = require('../models/user');
var Follow = require('../models/follow');

//M1 Guardar Follow
function saveFollow(req, res){
    var params = req.body;

    var follow = new Follow();
    follow.user = req.user.sub;
    follow.followed = params.followed; 

    follow.save((err, followedStored) =>{
        if(err) return res.status(500).send({message:'Error al guardar el seguimiento CF-M1'}); 
        if(!followedStored) return res.status(404).send({message:'El seguimiento no se ha guardado CF-M1'});
        return res.status(200).send({follow:followedStored});
    });
}
//M2 Borrar Follow
function deleteFollow(req, res){
    var userId = req.user.sub;
    var followId = req.params.id;

    Follow.find({'user':userId, 'followed':followId}).remove(err =>{
        if(err) return res.status(500).send({message:'Error al eliminar el follow  CF-M2'});
        return res.status(200).send({message:'El follow se ha eliminado'});
    });
} 
//M3 Obteniendo los usuarios
function getFollowingUsers(req, res){
    var userId = req.user.sub;
    if(req.params.id){  userId= req.params.id; }
    var page = 1;

    if (req.params.page){
        page = req.params.page;
    }
    var itemsPerPage = 4;
    Follow.find({user:userId}).populate({path:'followed'}).paginate(page, itemsPerPage, (err, follows, total) =>{
        if(err) return res.status(500).send({message:'Error en el servidor'});
        if(!follows) return res.status(404).send({message:'No estas siguiendo a ningun usuario'});
        
        followUserIds(userId).then((value) => {

            return res.status(200).send({
                total:total,
                pages: Math.ceil(total/itemsPerPage),
                follows,
                users_following: value.following,
                users_follow_me: value.followed
            });

        });
    });
}
//M4 usuarios que nos siguen a nosotros Paginada
function getFollowedUsers(req, res){
    var userId = req.user.sub;
    if(req.params.id){ userId= req.params.id; }
    var page = 1;

    if (req.params.page){ page = req.params.page; }
    var itemsPerPage = 4;
    Follow.find({followed:userId}).populate('user').paginate(page, itemsPerPage, (err, follows, total) =>{
        if(err) return res.status(500).send({message:'Error en el servidor'});
        if(!follows) return res.status(404).send({message:'No te sigue ningun usuarios'}); 
        
        followUserIds(userId).then((value) => {
      
            return res.status(200).send({
                total:total,
                pages: Math.ceil(total/itemsPerPage),
                follows,
                users_following: value.following,
                users_follow_me: value.followed
            });  
        });
    });
}

//Nuevo M4.5

async function followUserIds(user_id) {
    var following = await Follow.find({ user: user_id }).select({ _id: 0, __v: 0, user: 0 })
        .exec()
        .then((follows) => {
            var following_clean = [];
            follows.forEach((follow) => {
                following_clean.push(follow.followed);
            });
            return following_clean;
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

    console.log('following : '+following);
    return {
        following: following,
        followed: followed
    };
}

//M5 Devolver lista de usuarios que sigo
function getMyFollows(req, res){
    console.log('obtener ' +req.params.followed);
    var userId = req.user.sub;
    var find = Follow.find({user: userId});
    

    if(req.params.followed){
        find = Follow.find({followed:userId});
    }

    find.populate('user followed').exec((err, follows)=>{
        if(err) return res.status(500).send({message:'Error en el servidor: CF-M5 '});
        if(!follows) return res.status(404).send({message:'No sigues ningun usuario'}); 
        console.log('lista usaarios sigo ' + follows);
        return res.status(200).send({follows});
    });

}
//M6 Devolver usuarios que me siguen
function getFollowBack(req, res){
    var userId = req.user.sub;
    Follow.find({user: userId}).populate('user followed').exec((err, follows)=>{
        if(err) return res.status(500).send({message:'Error en el servidor: CF-M6 '});
        if(!follow) return res.status(404).send({message:'No sigues ningun usuario'}); 
        return res.status(200).send({follows});
    });
}



module.exports= {
    saveFollow,
    deleteFollow,
    getFollowingUsers,
    getFollowedUsers,
    getMyFollows
}