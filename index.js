'use strict';
var http	    = require('http');
var mongoose    = require('mongoose');
var PORT        =  process.env.PORT || 3800;
var server_host = process.env.YOUR_HOST || '0.0.0.0';
var conf    = require('./conf.json');
var app      = require('./app');
var server  = http.createServer(app);

mongoose.Promise = global.Promise;

const uri = "mongodb+srv://"+ conf.db.user+":"+ conf.db.password +"@"+conf.db.host+".azure.mongodb.net/test?retryWrites=true&w=majority";

mongoose.connect(uri,{ useNewUrlParser: true })
.then(() => {
  console.log("La conexion a la base de datos es realizado con exito");
  server.listen(PORT , server_host, function () {console.log(`Listening on ${ PORT }`) }
      );
})
.catch(err => console.log(err));
