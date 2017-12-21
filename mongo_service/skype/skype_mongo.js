var collectionName = 'skype'
const insertDocuments = function (db, callback, data, query) {
  // Get the documents collection
  const collection = db.collection(collectionName);
  // Insert some documents
  collection.insertMany([{
    a: 1
  }, {
    a: 2
  }, {
    a: 3
  }], function (err, result) {
    assert.equal(err, null);
    assert.equal(3, result.result.n);
    assert.equal(3, result.ops.length);
    callback(result);
  });
}

const findDocuments = function(db, callback, data, query) {
  // Get the documents collection
  const collection = db.collection(collectionName);
  // Find some documents
  collection.find({}).toArray(function(err, docs) {
    assert.equal(err, null);
    console.log("Found the following records");
    console.log(docs)
    callback(docs);
  });
}

const findDocumentsQuery = function(db, callback, data, query) {
  // Get the documents collection
  const collection = db.collection(collectionName);
  // Find some documents
  collection.find({'a': 3}).toArray(function(err, docs) {
    assert.equal(err, null);
    console.log("Found the following records");
    console.log(docs);
    callback(docs);
  });
}

const updateDocument = function(db, callback, data, query) {
  // Get the documents collection
  const collection = db.collection(collectionName);
  // Update document where a is 2, set b equal to 1
  collection.updateOne({ a : 2 }
    , { $set: { b : 1 } }, function(err, result) {
    assert.equal(err, null);
    assert.equal(1, result.result.n);
    console.log("Updated the document with the field a equal to 2");
    callback(result);
  });  
}

const removeDocument = function(db, callback, data, query) {
  // Get the documents collection
  const collection = db.collection(collectionName);
  // Delete document where a is 3
  collection.deleteOne({ a : 3 }, function(err, result) {
    assert.equal(err, null);
    assert.equal(1, result.result.n);
    console.log("Removed the document with the field a equal to 3");
    callback(result);
  });    
}

const indexCollection = function(db, callback) {
  db.collection(collectionName).createIndex(
    { "a": 1 },
      null,
      function(err, results) {
        console.log(results);
        callback();
    }
  );
};