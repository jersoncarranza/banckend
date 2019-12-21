'use strict';
var http	    = require('http');
var mongoose    = require('mongoose');
var PORT        =  process.env.PORT || 3800;
var server_host = process.env.YOUR_HOST || '0.0.0.0';
var conf    = require('./conf.json');
var app      = require('./app');
//var appserver     = new app();
var server  = http.createServer(app);
// var uristring =
//     process.env.MONGOLAB_URI ||
//     process.env.MONGOHQ_URL ||
//     'mongodb://localhost:27017/social';

mongoose.Promise = global.Promise;

const uri = "mongodb+srv://"+ conf.db.user+":"+ conf.db.password +"@"+conf.db.host+".azure.mongodb.net/test?retryWrites=true&w=majority";

//const uri= "mongodb+srv://boom:t3tjBtScoliOHf8e@clusterboom-9u5xr.azure.mongodb.net/test?retryWrites=true&w=majority";
mongoose.connect(uri,{ useNewUrlParser: true })
.then(() => {
  console.log("La conexion a la base de datos es realizado con exito");
  server.listen(PORT , server_host, function () {console.log(`Listening on ${ PORT }`) }
      );
})
.catch(err => console.log(err));

//mongodb+srv://boom:<password>@clusterboom-9u5xr.azure.mongodb.net/test?retryWrites=true&w=majority
//MongoNetworkError: failed to connect to server [clusterboom-shard-00-02-9u5xr.azure.mongodb.net:27017] on first connect [MongoNetworkError: connection 4 to clusterboom-shard-00-02-9u5xr.azure.mongodb.net:27017 closed