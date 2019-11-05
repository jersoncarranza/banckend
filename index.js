'use strict'

var mongoose = require('mongoose');
var app      = require('./app');
var port     = 3800;

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/social', {  useMongoClient: true })
.then(() => {
    console.log("La conexion a la base de datos es realizado con exito");
    //Crear Servidor
    app.listen(port, () => {
        console.log("Servidor corriendo: "+ port)
    });
})
.catch(err => console.log(err));