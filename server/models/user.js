const mongoose = require('mongoose')
const validator = require('validator')
const jwt = require('jsonwebtoken')
const _ = require('lodash')
const bcrypt = require('bcryptjs')
const uniqueValidator = require('mongoose-unique-validator')

var UserSchema = new mongoose.Schema({
  email: {
    type: String,
    trim: true,
    minlength: 1,
    required: true,
    unique: true,
    validate: {
      isAsync: false,
      validator: validator.isEmail,
      message: '{VALUE} is not a valid e-mail..'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  tokens: [{
    access: {
      type: String,
      required: true
    },
    token: {
      type: String,
      required: true
    }
  }]
}, {
  usePushEach: true
})

//adds validation for unique email
UserSchema.plugin(uniqueValidator)

//methods
UserSchema.methods.toJSON = function () {
  var user = this
  var userObject = user.toObject()

  return _.pick(userObject, ['_id', 'email'])
}
//svårt!!
UserSchema.methods.generateAuthToken = function () {
  var user = this
  var access = 'auth'
  var token = jwt.sign({_id: user._id.toHexString(), access}, 'abc123').toString()

  user.tokens.push({access, token})
  return user.save().then(() => {
    return token
  })
}

UserSchema.statics.findByToken = function (token) {
  var User = this
  var decoded

  try {
    decoded = jwt.verify(token, 'abc123')
  } catch (e) {
    return Promise.reject()
  }

  return User.findOne({
    '_id': decoded._id,
    'tokens.token': token,
    'tokens.access': 'auth'
  })
}

UserSchema.statics.findByCredentials = function (email, password) {
  var User = this

  return User.findOne({email}).then((user) => {
    if (!user) {
      return Promise.reject()
    }

    return bcrypt.compare(password, user.password).then((res) => {
      if (res) {
        return user
      }
      return Promise.reject()
    })
  })
}

//middleware - salt and encrypt pw 
UserSchema.pre('save', function (next) {
  var user = this
  
  if (user.isModified('password')) {
    if(process.env.NODE_ENV === 'test') { // maybe refactor this out to config.js
      var iterations = 2
    } else {
      iterations = 12
    }
    bcrypt.genSalt(iterations, (err, salt) => {
      bcrypt.hash(user.password, salt, (err, hash) => {
        user.password = hash
        next()
      })
    })
  } else {
    next()
  }
})

//return
var User = mongoose.model('User', UserSchema)

module.exports = {User}
