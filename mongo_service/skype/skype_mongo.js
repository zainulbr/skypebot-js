var collectionName = 'skype'
var assert = require('assert');

function insertDocuments(db, callback, data) {
  if (!data || typeof data === "undefined") {
    console.log("data must not null")
    return;
  }
  // Get the documents collection
  const collection = db.collection(collectionName);
  // Insert some documents
  collection.insertMany(data ||[],
    // [{
  //   a: 1
  // }, {
  //   a: 2
  // }, {
  //   a: 3
  // }]
  function (err, result) {
    assert.equal(err, null);
    assert.equal(data.length, result.result.n);
    assert.equal(data.length, result.ops.length);
    callback(result);
  });
}

function findDocuments(db, callback, query) {
  // Get the documents collection
  const collection = db.collection(collectionName);
  // Find some documents
  collection.find(
    query||{}
  ).toArray(function(err, docs){
    assert.equal(err, null);
    console.log("Found the following records");
    callback(docs);
  });
}

function updateDocument(db, callback, query,data) {
  if (!query || typeof query !== "undefined") {
    console.log("query must not null")
    return;
  }
  // Get the documents collection
  const collection = db.collection(collectionName);
  // Update document where a is 2, set b equal to 1
  collection.updateOne(query ||{},{$set :data||{}},
  // {   a: 2 // where
  // }, {
  //   $set: {
  //     b: 1 //set
  //   }},
  function (err, result) {
    assert.equal(err, null);
    assert.equal(data.length, result.result.n);
    console.log("Updated the document");
    callback(result);
  });
}

function removeDocument(db, callback, query) {
  if (!query || typeof query !== "undefined") {
    console.log("query must not null")
    return;
  }
  // Get the documents collection
  const collection = db.collection(collectionName);
  // Delete document where a is 3
  collection.deleteOne(
    // {a: 3}
    query || {},
    function (err, result) {
    assert.equal(err, null);
    assert.equal(query.length, result.result.n);
    console.log("Removed the document");
    callback(result);
  });
}

function indexCollection(db, callback, data) {
  db.collection(collectionName).createIndex(data||{},
      // "a": 1
      // example,
    null,
    function (err, results) {
      console.log(results);
      callback();
    }
  );
};


module.exports = {
  find: findDocuments,
  insert : insertDocuments,
  setIndex : indexCollection,
  update : updateDocument,
  delete : removeDocument,
}