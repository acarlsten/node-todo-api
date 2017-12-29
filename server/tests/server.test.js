const request = require('supertest')
const expect = require('expect')
const {ObjectID} = require('mongodb')

const {app} = require('./../server')
const {Todo} = require('./../models/todo')
const {User} = require('./../models/user')
const {todos, populateTodos, users, populateUsers} = require('./seed/seed')

beforeEach(populateUsers)
beforeEach(populateTodos)

const fakeId = new ObjectID().toHexString()
var todoId = (x) => todos[x]._id.toHexString() // to allow picking of todo from above

describe('POST /todos', () => {

  it('should create a new Todo', (done) => {
    var text = 'Test todo text string'
    request(app)
      .post('/todos')
      .set('x-auth', users[0].tokens[0].token)
      .send({text})
      .expect(200)
      .expect((res) => {
        expect(res.body.text).toBe(text)
      })
      .end((err) => {
        if (err) {
          return done(err)
        }

        Todo.find({text}).then((todos) => {
          expect(todos.length).toBe(1)
          expect(todos[0].text).toBe(text)
          done()
        }).catch((e) => done(e))
      })
  })

  it('should not create a todo with invalid data', (done) => {
    request(app)
      .post('/todos')
      .set('x-auth', users[0].tokens[0].token)
      .send({})
      .expect(400)
      .end((err) => {
        if (err) {
          return done(err)
        }

        Todo.find().then((todos) => {
          expect(todos.length).toBe(2)
          done()
        }).catch((e) => done(e))
      })
  })
})

describe('GET /todos', () => {

  it('should get all todos', (done) => {
    request(app)
      .get('/todos')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.todos.length).toBe(1)
      })
      .end(done)
  })

})

describe('GET /todos/:id', () => {
  it('should get the correct todo', (done) => {
    request(app)
      .get(`/todos/${todoId(0)}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe('First test todo')
      })
      .end(done)
  })

  it('should not get a todo created by someone else', (done) => {
    request(app)
      .get(`/todos/${todoId(1)}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done)
  })

  it('should return a 404 if todo not found', (done) => {
    request(app)
      .get(`/todos/${fakeId}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .expect((res) => {
        expect(res.body.errormessage).toBe(`Unable to find TODO with id: ${fakeId}`)
      })
      .end(done)
  })

  it('should return a 400 if the ObjectID is invalid', (done) => {
    request(app)
      .get('/todos/INVALID')
      .set('x-auth', users[0].tokens[0].token)
      .expect(400)
      .expect((res) => {
        expect(res.body.errormessage).toBe('Invalid ID')
      })
      .end(done)
  })
})

describe('DELETE /todos/:id', () => {
  it('should remove the correct todo', (done) => {
    request(app)
      .delete(`/todos/${todoId(1)}`)
      .set('x-auth', users[1].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo._id).toBe(todoId(1))
      })
      .end((err) => {

        if (err) {
          return done(err)
        }

        Todo.findById(todoId(1)).then((todo) => {
          expect(todo).toBeNull()
          done()
        }).catch((e) => done(e))
      })
  })

  it('should not remove an unowned todo', (done) => {
    request(app)
      .delete(`/todos/${todoId(0)}`)
      .set('x-auth', users[1].tokens[0].token)
      .expect(404)
      .end((err) => {

        if (err) {
          return done(err)
        }

        Todo.findById(todoId(0)).then((todo) => {
          expect(todo).toBeTruthy()
          done()
        }).catch((e) => done(e))
      })
  })

  it('should return a 404 if todo not found', (done) => {
    request(app)
      .delete(`/todos/${fakeId}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .expect((res) => {
        expect(res.body.errormessage).toBe(`Unable to find TODO with id: ${fakeId}`)
      })
      .end(done)
  })

  it('should return a 400 if the ObjectID is invalid', (done) => {
    request(app)
      .delete('/todos/INVALID')
      .set('x-auth', users[0].tokens[0].token)
      .expect(400)
      .expect((res) => {
        expect(res.body.errormessage).toBe('Invalid ID')
      })
      .end(done)
  })
})

describe('PATCH /todos/:id', () => {

  it('should update the correct todo', (done) => {
    request(app)
      .patch(`/todos/${todoId(0)}`)
      .set('x-auth', users[0].tokens[0].token)
      .send({completed: true, text: 'new text'})
      .expect(200)
      .expect((res) => {
        expect(res.body.todo._id).toBe(todoId(0)),
        expect(res.body.todo.completed).toBe(true),
        expect(typeof res.body.todo.completedAt).toBe('number')
      })
      .end((err) => {
        if (err) {
          return done(err)
        }

        Todo.findById(todoId(0)).then((todo) => {
          expect(todo.completed).toBe(true)
          expect(todo.text).toBe('new text')
          expect(typeof todo.completedAt).toBe('number')
          done()
        }).catch((e) => done(e))
      })
  })

  it('shouldnt update someone elses todo', (done) => {
    request(app)
      .patch(`/todos/${todoId(0)}`)
      .set('x-auth', users[1].tokens[0].token)
      .send({completed: true, text: 'new text'})
      .expect(404)
      .end((err) => {
        if (err) {
          return done(err)
        }

        Todo.findById(todoId(0)).then((todo) => {
          expect(todo.completed).toBe(false)
          expect(todo.text).toBe('First test todo')
          expect(todo.completedAt).toBeNull()
          done()
        }).catch((e) => done(e))
      })
  })

  it('should clear completedAt when todo is not completed', (done) => {
    request(app)
      .patch(`/todos/${todoId(1)}`)
      .set('x-auth', users[1].tokens[0].token)
      .send({completed: false})
      .expect(200)
      .expect((res) => {
        expect(res.body.todo._id).toBe(todoId(1)),
        expect(res.body.todo.completed).toBe(false),
        expect(res.body.todo.completedAt).toBeNull()
      })
      .end((err) => {
        if (err) {
          return done(err)
        }

        Todo.findById(todoId(1)).then((todo) => {
          expect(todo._id.toString()).toBe(todoId(1)),
          expect(todo.completed).toBe(false),
          expect(todo.completedAt).toBeNull()
          done()
        }).catch((e) => done(e))
      })
  })

  it('should return a 404 if todo not found', (done) => {
    request(app)
      .patch(`/todos/${fakeId}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .expect((res) => {
        expect(res.body.errormessage).toBe(`Unable to find TODO with id: ${fakeId}`)
      })
      .end(done)
  })

  it('should return a 400 if the ObjectID is invalid', (done) => {
    request(app)
      .patch('/todos/INVALID')
      .set('x-auth', users[0].tokens[0].token)
      .expect(400)
      .expect((res) => {
        expect(res.body.errormessage).toBe('Invalid ID')
      })
      .end(done)
  })
})

describe('GET /users/me', () => {
  it('should return user if authenticated', (done) => {
    request(app)
      .get('/users/me')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body._id).toBe(users[0]._id.toHexString())
        expect(res.body.email).toBe(users[0].email)
      })
      .end(done)
  })

  it('should return 401 if not authenticated', (done) => {
    request(app)
      .get('/users/me')
      .expect(401)
      .end(done)
  })
})

describe('POST /users', () => {
  it('should create a user', (done) => {
    var email = 'emmalarsson@hotmail.com'
    var password = 'EmmaPemma'
    request(app)
      .post('/users')
      .send({email, password})
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-auth']).toBeTruthy()
        expect(res.body._id).toBeTruthy()
        expect(res.body.email).toBe(email)
      })
      .end((err) => {
        if (err) {
          return done(err)
        }

        User.findOne({email}).then((user) => {
          expect(user).toBeTruthy()
          expect(user.password).not.toBe(password)
          done()
        }).catch((e) => done(e))
      })
  })

  it('should return validation errors if req invalid', (done) => {
    var email = 'shoblo'
    var password = 'feto'
    request(app)
      .post('/users')
      .send({email, password})
      .expect(400)
      .expect((res) => {
        expect(res.body.password.kind).toBe('minlength')
        expect(res.body.email.message).toBe(`${email} is not a valid e-mail..`)
      })
      .end(done)
  })

  it('should not create user if email in use', (done) => {
    var email = 'adam@karlsten.co'
    var password = 'sixchars'
    request(app)
      .post('/users')
      .send({email, password})
      .expect(400)
      .expect((res) => {
        expect(res.body.email.kind).toBe('unique')
      })
      .end(done)
  })
})

describe('POST /users/login', () => {
  it('should login user and return x-auth token', (done) => {
    request(app)
      .post('/users/login')
      .send({
        email: users[1].email,
        password: users[1].password
      })
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-auth']).toBeTruthy()
      })
      .end((err, res) => {
        if (err) {
          return done(err)
        }

        User.findById(users[1]._id).then((user) => {
          expect(user.toObject().tokens[0]).toMatchObject({
            access: 'auth',
            token: res.headers['x-auth']
          })
          done()
        }).catch((e) => done(e))
      })
  })

  it('should reject invalid login', (done) => {
    request(app)
      .post('/users/login')
      .send({
        email: users[1].email,
        password: 'hurfydurf'
      })
      .expect(400)
      .expect((res) => {
        expect(res.headers['x-auth']).toBeFalsy()
      })
      .end((err) => {
        if (err) {
          return done(err)
        }

        User.findById(users[1]._id).then((user) => {
          expect(user.tokens).toHaveLength(1)
          done()
        }).catch((e) => done(e))
      })
  })
})

describe('DELETE /users/me/token', () => {
  it('should delete auth token on logout', (done) => {
    request(app)
      .delete('/users/me/token')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.message).toBe('You are now logged out!')
      })
      .end((err) => {
        if (err) {
          return done(err)
        }

        User.findById(users[0]._id).then((user) => {
          expect(user.tokens).toHaveLength(0)
          done()
        }).catch((e) => done(e))
      })
  })
})