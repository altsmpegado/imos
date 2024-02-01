const mongoose = require('mongoose');
const { Schema } = mongoose;

const submissionSchema = new Schema({
  name: { type: String, required: true },
  company: { type: String, required: true },
  version: { type: String, required: true },
  about: { type: String, required: true },
  update: { type: String, required: false },
  info: { type: String, required: false },
  files: { type: String, required: true },
});

const SubmissionModel = mongoose.model('app', submissionSchema);
module.exports = SubmissionModel;