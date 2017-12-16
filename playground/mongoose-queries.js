const {ObjectID} = require('mongodb')
const {mongoose} = require('./../server/db/mongoose')
const {Todo} = require('./../server/models/todo')
const {User} = require('./../server/models/user')

// var id = '5a31b5d37e6be60570c401bf11'

// if(!ObjectID.isValid(id)) {
//   console.log('ID not valid..')
// }

// Todo.findById(id).then((todo) => {
//   if(!todo) {
//     return console.log('ID not found..')
//   }
//   console.log('Todo by Id:', todo)
// }).catch((e) => console.log(e))

var id = '5a305b7c4ea2870534eeedef'

if(!ObjectID.isValid(id)) {
  console.log('ID is not valid..')
}

User.findById(id).then((user) => {
  if(!user) {
    return console.log('ID not found..')
  }
  console.log('User by ID:', JSON.stringify(user, undefined, 2))
}).catch((e) => console.log(e))