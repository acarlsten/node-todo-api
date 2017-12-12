// const MongoClient = require('mongodb').MongoClient
const {MongoClient, ObjectId} = require('mongodb')

MongoClient.connect('mongodb://localhost:27017/TodoApp', (err, client) => {
  if (err) {
    return console.log('Unable to connect to MongoDB server..')
  }
  console.log('Connected to MongoDB server..')
  var db = client.db('TodoApp')

  db.collection('Users').findOneAndUpdate({
    _id: new ObjectId('5a2bcf6f1194b504e49f0945')
  }, {
    $set: {
      name: 'Adam'
    },
    $inc: {
      age: 1
    }
  }, {
    returnOriginal: false
  }).then((result) => {
    console.log(result)
  })

  // client.close()
})

//test change