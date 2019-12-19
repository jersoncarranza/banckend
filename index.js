'use strict';
var http	    = require('http');
var mongoose    = require('mongoose');
var PORT        =  process.env.PORT || 3800;
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
mongoose.connect(uri,{ useNewUrlParser: true })
.then(() => {
    console.log("La conexion a la base de datos es realizado con exito");
    server.listen(PORT);
    //, () => {console.log(`Listening on ${ PORT }`)    }
})
.catch(err => console.log(err));
//mongoose.connect(uristring , {  useMongoClient: true })

/*
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://boom:"+ conf.db.password +"@clusterboom-9u5xr.azure.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true });
client.connect(err => {
  const collection = client.db("test").collection("devices");
  client.close();
});
*/