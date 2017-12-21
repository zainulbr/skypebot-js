var MongoClient = require('mongodb').MongoClient;

var assert = require('assert');
// Connection URL
const url = 'mongodb://localhost:27017';
// Database Name
const dbName = 'ctms';


module.exports = {
  client : MongoClient,
  url : url,
  db : dbName 
}


// Initialize connection once
MongoClient.connect("mongodb://localhost:27017/integration_test", function(err, database) {
  if(err) throw err;

  db = database;

  // Start the application after the database connection is ready
  app.listen(3000);
  console.log("Listening on port 3000");
});


// var DBclient = "data";
// MongoClient.connect(url, (err, client) => {
//   assert.equal(null, err);
//   console.log("Connected successfully to server" , DBclient);
//   const db = client.db(dbName);
//   insertDocuments(db, function() {
//   client.close();
//   });
// });
