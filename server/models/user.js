const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  type: {
    type: String,
    required: true,
    unique: false
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  ownedApps: [{
    type: String,
    unique: false
  }]
});

UserSchema.plugin(passportLocalMongoose);

const UserModel = mongoose.model('user', UserSchema);
module.exports = UserModel;