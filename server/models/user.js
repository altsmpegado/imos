const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const { isAlphanumeric, isEmail } = require('validator');
const Schema = mongoose.Schema;

const cloudAppSchema = new Schema({
  app: { type: String, required: true },
  state: { type: String, required: true },
  image: { type: String, required: true },
  type: { type: String, required: true },
  container_name: { type: String, required: true },
  configs: { type: JSON, required: true }
});


const UserSchema = new Schema({
  type: {
    type: String,
    required: true,
    unique: false,
    enum: ['client', 'developer']
  },

  username: {
    type: String,
    required: true,
    unique: true,
    minlength: [3, 'Username must be at least 4 characters long'],
    maxlength: [20, 'Username must not exceed 20 characters'],
    validate: [
      {
        validator: isAlphanumeric,
        message: 'Username must contain only letters and numbers'
      }
    ]
  },

  email: {
    type: String,
    required: true,
    unique: true,
    maxlength: [30, 'Username must not exceed 30 characters'],
    validate: [
      {
        validator: isEmail,
        message: 'Invalid email format'
      }
    ]
  },

  ownedApps: [{
    type: String,
    unique: false
  }],

  cloudApps: [cloudAppSchema],

  subApps: [{
    type: String,
    unique: false
  }]
});

UserSchema.plugin(passportLocalMongoose);

const UserModel = mongoose.model('user', UserSchema);
module.exports = UserModel;