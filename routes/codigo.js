'use strict' 

var express = require('express');
var CodigoController = require('../controllers/codigo');

var api = express.Router();

var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir:'./uploads/pagos'});
api.post('/save-codigo', CodigoController.saveCodigo);

api.post('/upload-image-pay/:id', [md_upload], CodigoController.uploadImagePay);


module.exports = api;

