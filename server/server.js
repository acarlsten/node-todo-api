require('./config/config')

const _ = require('lodash')
const express = require('express')
const bodyParser = require('body-parser')
const {ObjectID} = require('mongodb')

var {mongoose} = require('./db/mongoose')
var {Todo} = require('./models/todo')
var {User} = require('./models/user')
var {authenticate} = require('./middleware/authenticate')

var app = express()
const port = process.env.PORT

app.use(bodyParser.json())

//Todo routes

app.post('/todos', (req, res) => {
  var todo = new Todo({
    text: req.body.text
  })

  todo.save().then((doc) => {
    res.send(doc)
  }, (e) => {
    res.status(400).send(e)
  })
})

app.get('/todos', (req, res) => {
  Todo.find().then((todos) => {
    res.send({
      todos
    })
  }, (e) => {
    res.status(400).send(e)
  })
})

app.get('/todos/:id', (req, res) => {
  var id = req.params.id

  if(!ObjectID.isValid(id)) {
    return res.status(400).send({
      errormessage: 'Invalid ID'
    })
  }

  Todo.findById(id).then((todo) => {
    if(!todo) {
      return res.status(404).send({
        errormessage: `Unable to find TODO with id: ${id}`
      })
    }
    res.send({todo})
  }).catch((e) => {
    res.status(400).send()
  })
})

app.delete('/todos/:id', (req, res) => {
  var id = req.params.id

  if(!ObjectID.isValid(id)) {
    return res.status(400).send({
      errormessage: 'Invalid ID'
    })
  }

  Todo.findByIdAndRemove(id).then((todo) => {
    if(!todo) {
      return res.status(404).send({
        errormessage: `Unable to find TODO with id: ${id}`
      })
    }
    res.send({
      message: `Successfully deleted TODO with id: ${id}`,
      todo
    })
  }).catch((e) => {
    res.status(400).send()
  })
})

app.patch('/todos/:id', (req, res) => {
  var id = req.params.id
  var body = _.pick(req.body, ['text', 'completed'])

  if(!ObjectID.isValid(id)) {
    return res.status(400).send({
      errormessage: 'Invalid ID'
    })
  }

  if(_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime()
  } else {
    body.completed = false,
    body.completedAt = null
  }

  Todo.findByIdAndUpdate(id, {$set: body}, {new: true}).then((todo) => {
    if(!todo) {
      return res.status(404).send({
        errormessage: `Unable to find TODO with id: ${id}`
      })
    }
    res.send({todo})
  }).catch((e) => {
    res.status(400).send()
  })
})

//User routes

app.post('/users', (req, res) => {
  var body = _.pick(req.body, ['email', 'password'])
  var user = new User(body)

  user.save().then(() => {
    return user.generateAuthToken()
  }).then((token) => {
    res.header('x-auth', token).send(user)
  }).catch((e) => {
    res.status(400).send(e.errors)
  })
})

app.get('/users/me', authenticate, (req, res) => {
  res.send(req.user)
})

app.post('/users/login', (req, res) => {
  var body = _.pick(req.body, ['email', 'password'])

  User.findByCredentials(body.email, body.password).then((user) => {
    return user.generateAuthToken().then((token) => {
      res.header('x-auth', token).send(user)
    })
  }).catch((e) => {
    res.status(400).send()
  })
})

app.delete('/users/me/token', authenticate, (req, res) => {
  req.user.removeToken(req.token).then(() => {
    res.status(200).send({message: 'You are now logged out!'})
  }, () => {
    res.status(400).send()
  })
})

app.listen(port, () => {
  console.log(`Started on port ${port}..`)
})

module.exports = {app}