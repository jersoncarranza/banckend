'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MatchSchema = ({
    estado:     Number,
    created_at: String,
    viewed:     Number,
    liked:      Boolean,
    emitter: {type: Schema.ObjectId, ref:'User'},
    receiver:{type: Schema.ObjectId, ref:'User'}
});

module.exports = mongoose.model('Macth', MatchSchema);