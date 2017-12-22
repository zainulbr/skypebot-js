var mongodb = require('mongodb');
var MongoClient = require('mongodb').MongoClient;
var database;

var assert = require('assert');
// Connection URL
const url = 'mongodb://localhost:27017';
// Database Name
const dbName = 'ctms';

function Connect(callback) {
  // Initialize connection once
  MongoClient.connect(url, (err, client) => { 
    if (err) throw err;
    database = client.db(dbName);
    console.log("database connect success");
    callback(database);
    // Start the application after the database connection is ready
  });

}
// Reuse database object in request handlers
// app.get("/", function (req, res) {
//   db.collection("replicaset_mongo_client_collection").find({}, function (err, docs) {
//     docs.each(function (err, doc) {
//       if (doc) {
//         console.log(doc);
//       } else {
//         res.end();
//       }
//     });
//   });
// });


module.exports = {
  client: MongoClient,
  mongodb:mongodb,
  con: Connect,
  db: database,
}


// var DBclient = "data";
// MongoClient.connect(url, (err, client) => {
//   assert.equal(null, err);
//   console.log("Connected successfully to server" , DBclient);
//   const db = client.db(dbName);
//   insertDocuments(db, function() {
//   client.close();
//   });
// });