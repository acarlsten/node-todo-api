const {ObjectID} = require('mongodb')
const {mongoose} = require('./../server/db/mongoose')
const {Todo} = require('./../server/models/todo')
const {User} = require('./../server/models/user')

// Todo.remove({}).then((result) => {
//   console.log(result)
// })

// Todo.findOneAndRemove()

// Todo.findByIdAndRemove()
Todo.findOneAndRemove({_id: '5a35a8da0c4cc802e94140f2'})
Todo.findByIdAndRemove('5a35a8da0c4cc802e94140f2').then((todo) => {
  console.log(todo)
})