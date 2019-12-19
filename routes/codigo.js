'use strict';

var express = require('express');
var CodigoController = require('../controllers/codigo');
var mailController = require('../controllers/mail');
var api = express.Router();

var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir:'./uploads/pagos'});
api.post('/save-codigo', CodigoController.saveCodigo);
api.post('/upload-image-pay/:id', [md_upload], CodigoController.uploadImagePay);

api.post('/envio-correo',mailController.sendEmail);

api.get('/user-code/:page?', CodigoController.getUsuarioCodigo);
api.get('/get-image-pago/:imageFile', CodigoController.getImagePago);

api.put('/edit-estado-pago', CodigoController.putEstadoPago);



module.exports = api;

