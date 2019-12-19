'use strict';
var express = require('express');
var EntidadController = require('../controllers/entidad');
var api = express.Router();
api.get('/get-entidades', EntidadController.getEntidad);

module.exports = api;
