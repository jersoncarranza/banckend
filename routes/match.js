'use strict';
var express = require('express');
var MatchController = require('../controllers/match');
var api = express.Router();
var md_auth = require('../middlewares/authenticated');
api.get('/get-match', md_auth.ensureAuth, MatchController.getMatch);
api.post('/save-match', md_auth.ensureAuth, MatchController.saveMatch);

module.exports = api;