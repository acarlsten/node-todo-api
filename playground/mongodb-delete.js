// const MongoClient = require('mongodb').MongoClient
const {MongoClient, ObjectId} = require('mongodb')

MongoClient.connect('mongodb://localhost:27017/TodoApp', (err, client) => {
  if (err) {
    return console.log('Unable to connect to MongoDB server..')
  }
  console.log('Connected to MongoDB server..')
  var db = client.db('TodoApp')

  db.collection('Users').findOneAndDelete({
    _id: new ObjectId('5a2b362ee01840061d919737')
  }).then((result) => {
    console.log(JSON.stringify(result, undefined, 2))
  })


  // db.collection('Todos').deleteMany({text: 'Eat lunch'}).then((result) => {
  //   console.log(result)
  // })

  // db.collection('Todos').deleteOne({text: 'Eat lunch'}).then((result) => {
  //   console.log(result)
  // })

  // db.collection('Todos').findOneAndDelete({completed: true}).then((result) => {
  //   console.log(result)
  // })

  // client.close()
})

//test change