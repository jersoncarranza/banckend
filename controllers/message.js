'use strict';
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var User = require('../models/user');
var Follow = require('../models/follow');
var Message = require('../models/message');

function probando(req, res){
    return res.json('ok');
}

function saveMessage(req, res){
    var params = req.body;
    if(!params.text || !params.receiver)
    return res.status(200).send({message:'Envia los datos necesarios'})

    var message = new Message();
    message.emitter = req.user.sub;
    message.receiver= params.receiver;
    message.text =    params.text;
    message.created_at = moment().unix();


    message.save((err, messageStored) =>{
        if(err) return res.status(200).send({message:'Error en la peticion',status :0});
        if(!messageStored) return res.status(200).send({message:'Error al enviar el mensaje',status :0});

        return res.status(200).send({
            message:messageStored,
            status :1
        })
    });

}

function getReceivedMessages(req, res){
    var userId = req.user.sub;
    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }
    var itemsPerPage = 4;
    Message.find({receiver:userId}).populate('emitter','_id image nickname lastname name').sort('-created_at').paginate(page, itemsPerPage,(err, messages, total)=>{
        if(err) return res.status(200).send({message:'Error en la peticion',   status:0});
        if(!messages) return res.status(200).send({message:'No hay mensajes',   status:0});
        
        return res.status(200).send({
            total:total,
            pages: Math.ceil(total/itemsPerPage),
            messages,
            status:1
            
        })
    });
}

function getEmmitMessages(req, res){
    var userId = req.user.sub;
    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }
    var itemsPerPage = 4;
    console.log('listar los mensajes');
    Message.find({emitter:userId}).populate('emitter receiver','_id image nickname lastname name').sort('-created_at').paginate(page, itemsPerPage,(err, messages, total)=>{
        if(err) return res.status(200).send({message:'Error en la peticion', status:0});
        if(!messages) return res.status(200).send({message:'No hay mensajes',status:0});
        
        return res.status(200).send({
            total:total,
            pages: Math.ceil(total/itemsPerPage),
            messages,
            status:1
            
        })
    });
}

function getUnviewedMessages(req,res){
    var userId = req.user.sub;
    Message.count({receiver:userId , viewed:'false'}).exec((err, count) =>{
        if(err) return res.status(200).send({message:'Error en la peticion', status:0});
        return res.status(200).send({
            'unviewed':count,
            status:1
        });
    });
}

function setViewedMessages(req, res)
{
    var userId = req.user.sub;
    Message.update({receiver: userId, viewed:'false'}, {viewed:true},{"multi":true}, (err, messageUpdated)=>{
        if(err) return res.status(200).send({message:'Error en la peticion', status:0});
        return res.status(200).send({
            messages: messageUpdated,
            status:1
        });
    });
}

module.exports ={
    probando,
    saveMessage,
    getReceivedMessages,
    getEmmitMessages,
    getUnviewedMessages,
    setViewedMessages
}