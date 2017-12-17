const request = require('supertest')
const expect = require('expect')
const {ObjectID} = require('mongodb')

const {app} = require('./../server')
const {Todo} = require('./../models/todo')

const todos = [{
  _id: new ObjectID(),
  text: 'First test todo'
}, {
  _id: new ObjectID(),
  text: 'Second test todo',
  completed: true,
  completedAt: 1234567
}]

const fakeId = new ObjectID().toHexString()
var todoId = (x) => todos[x]._id.toHexString() // to allow picking of todo from above

beforeEach((done) => {
  Todo.remove({}).then(() => {
    return Todo.insertMany(todos)
  }).then(() => done())
})

describe('POST /todos', () => {

  it('should create a new Todo', (done) => {
    var text = 'Test todo text string'
    request(app)
      .post('/todos')
      .send({text})
      .expect(200)
      .expect((res) => {
        expect(res.body.text).toBe(text)
      })
      .end((err, res) => {
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
      .send({})
      .expect(400)
      .end((err, res) => {
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
      .expect(200)
      .expect((res) => {
        expect(res.body.todos.length).toBe(2)
      })
      .end(done)
  })

})

describe('GET /todos/:id', () => {
  it('should get the correct todo', (done) => {
    request(app)
      .get(`/todos/${todoId(0)}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe('First test todo')
      })
      .end(done)
  })

  it('should return a 404 if todo not found', (done) => {
    request(app)
      .get(`/todos/${fakeId}`)
      .expect(404)
      .expect((res) => {
        expect(res.body.errormessage).toBe(`Unable to find TODO with id: ${fakeId}`)
      })
      .end(done)
  })

  it('should return a 400 if the ObjectID is invalid', (done) => {
    request(app)
      .get('/todos/INVALID')
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
      .delete(`/todos/${todoId(0)}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo._id).toBe(todoId(0))
      })
      .end((err, res) => {

        if (err) {
          return done(err)
        }

        Todo.findById(todoId(0)).then((todo) => {
          expect(todo).toBeNull()
          done()
        }).catch((e) => done(e))
      })
  })

  it('should return a 404 if todo not found', (done) => {
    request(app)
      .delete(`/todos/${fakeId}`)
      .expect(404)
      .expect((res) => {
        expect(res.body.errormessage).toBe(`Unable to find TODO with id: ${fakeId}`)
      })
      .end(done)
  })

  it('should return a 400 if the ObjectID is invalid', (done) => {
    request(app)
      .delete('/todos/INVALID')
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
      .send({completed: true, text: 'new text'})
      .expect(200)
      .expect((res) => {
        expect(res.body.todo._id).toBe(todoId(0)),
        expect(res.body.todo.completed).toBe(true),
        expect(typeof res.body.todo.completedAt).toBe('number')
      })
      .end((err, res) => {
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

  it('should clear completedAt when todo is not completed', (done) => {
    request(app)
      .patch(`/todos/${todoId(1)}`)
      .send({completed: false})
      .expect(200)
      .expect((res) => {
        expect(res.body.todo._id).toBe(todoId(1)),
        expect(res.body.todo.completed).toBe(false),
        expect(res.body.todo.completedAt).toBeNull()
      })
      .end((err, res) => {
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
      .expect(404)
      .expect((res) => {
        expect(res.body.errormessage).toBe(`Unable to find TODO with id: ${fakeId}`)
      })
      .end(done)
  })

  it('should return a 400 if the ObjectID is invalid', (done) => {
    request(app)
      .patch('/todos/INVALID')
      .expect(400)
      .expect((res) => {
        expect(res.body.errormessage).toBe('Invalid ID')
      })
      .end(done)
  })
})