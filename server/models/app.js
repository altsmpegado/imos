const mongoose = require('mongoose');
const { Schema } = mongoose;

const applicationSchema = new Schema({
  name: { type: String, required: true },
  version: { type: String, required: true },
  // Add other fields as needed
  files: [{ name: String, content: Buffer }],
});

const AppModel = mongoose.model('app', applicationSchema);
module.exports = AppModel;