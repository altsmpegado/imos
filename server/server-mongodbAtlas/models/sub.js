const mongoose = require('mongoose');
const { Schema } = mongoose;

const submissionSchema = new Schema({
  appname: { type: String, required: true },
  company: { type: String, required: true },
  version: { type: String, required: true },
  about: { type: String, required: true },
  update: { type: String, required: false },
  info: { type: String, required: false },
  fileId: { type: String, required: true },
  state: { type: Boolean, required: true },
});

const SubmissionModel = mongoose.model('sub', submissionSchema);
module.exports = SubmissionModel;