var mongoose = require('mongoose')

var uri = 'mongodb://localhost:27017/TodoApp'
var options = {
  useMongoClient: true
}

mongoose.Promise = global.Promise
mongoose.connect(uri, options).then(() => {
  console.log('Connection established to MongoDB server..')
}, () => {
  console.log('WARNING! Unable to connect to MongoDB server..')
} )


module.exports = {mongoose}