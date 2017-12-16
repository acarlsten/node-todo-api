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
  text: 'Second test todo'
}]

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
      .get(`/todos/${todos[0]._id.toHexString()}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe('First test todo')
      })
      .end(done)
  })

  it('should return a 404 if todo not found', (done) => {
    var id = new ObjectID().toHexString()
    request(app)
      .get(`/todos/${id}`)
      .expect(404)
      .expect((res) => {
        expect(res.body.errormessage).toBe(`Unable to find TODO with id: ${id}`)
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