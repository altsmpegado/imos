const mongoose = require('mongoose');
const { Schema } = mongoose;

const applicationSchema = new Schema({
  name: { type: String, required: true, unique: true },
  company: { type: String, required: true },
  version: { type: String, required: true },
  info: { type: String, required: true },
  // best option would be a cloud storage and save the redirect urls
  file: { type: String, required: true },
  logo: { type: String, required: true },
});

const AppModel = mongoose.model('app', applicationSchema);
module.exports = AppModel;