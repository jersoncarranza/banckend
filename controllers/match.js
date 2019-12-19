'use strict';
var User = require('../models/user');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');
var User = require('../models/user');
var Match = require('../models/match');

function getMatch(req, res){
    var identity_user_id = req.user.sub;
    var genUser = req.user.genero;
    var genSearch = genUser == 'M' ? "H" : "M";
    
    matchViewed(identity_user_id).then((value) => {
        var query = {_id:{$nin:value.matchViewedEmitter},'genero':genSearch};
            User.findOne(query).sort('-created_at').exec((err, candidato) =>{
                if(err) return res.status(200).send({message:'Error en la peticion', status:0});
                return res.status(200).send({
                    candidato:candidato,
                    status:1,
                    message:'ok'
                });
            });
    });

};

function saveMatch(req, res){

    var match       = new Match();
    var matchParams = req.body;
    match.estado    = matchParams.estado;
    match.created_at= moment().unix();
    match.viewed    = matchParams.viewed;
    match.liked     = matchParams.liked;
    match.emitter   = matchParams.emitter;
    match.receiver  = matchParams.receiver;

    if (match.liked == true) {
        
        notifyPosibleMatch(match.emitter,match.receiver).then((value) => {
            value.matchProbably;
            match.save((err, matchStored) =>{
                if(err) return res.status(500).send({message:'Error en la peticion del match '+err,status:0,});
                if(!matchStored) return res.status(500).send({message:'Error al match'+ err,status:0,});
                
                return res.status(200).send({
                    match:matchStored,
                    status:1,
                    message:'ok',
                    notify: value.matchProbably
                });
            });  
        });
        
    }else{
        match.save((err, matchStored) =>{
            if(err) return res.status(500).send({message:'Error en la peticion del match '+err,status:0,});
            if(!matchStored) return res.status(500).send({message:'Error al match'+ err,status:0,});
            
            return res.status(200).send({
                match:matchStored,
                status:1,
                message:'ok',
                notify: 0
            })
        }); 
    }

    };


async function matchViewed(user_id) {
    //Los match que le dio like el usuario (Con el fin que no se repita)
    var matchViewedEmitter = await Match.find({ emitter: user_id })//.select({ _id: 0, __v: 0, user: 0 })
    .exec()
    .then((matchEmitter) => {
            var match_receiver = [];
            matchEmitter.forEach((match) => {
                match_receiver.push(match.receiver);
            });
            //Los candidatos que ya han hecho
            return match_receiver;
        })
        .catch((err) => {
            return handleError(err);
        });


        return {
            matchViewedEmitter: matchViewedEmitter
        };
    }
    
    async function notifyPosibleMatch(emitter,receiver){
        var query = {'emitter':receiver, 'receiver':emitter, 'liked':true};
        var matchProbably = await Match.countDocuments(query)//.select({ _id: 0, __v: 0, user: 0 })
        .exec()
        .then((matchEmitter) => {
                return matchEmitter;
        })
        .catch((err) => {
            return handleError(err);
        });
    
        return {
            matchProbably: matchProbably
        };
    };


module.exports ={
    getMatch,
    saveMatch
}