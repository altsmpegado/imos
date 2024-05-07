const mongoose = require('mongoose');
const { Schema } = mongoose;

const applicationSchema = new Schema({
  name: { type: String, required: true },
  company: { type: String, required: true },
  version: { type: String, required: true },
  info: { type: String, required: true },
  files: { type: String, required: true },
});

const AppModel = mongoose.model('app', applicationSchema);
module.exports = AppModel;