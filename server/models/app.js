const { json } = require('express');
const mongoose = require('mongoose');
const { Schema } = mongoose;

const applicationSchema = new Schema({
  name: { type: String, required: true, unique: true },
  image: { type: String, required: true, unique: true },
  type: { type: String, required: true, unique: false, enum: ['image', 'multicontainer'] },
  company: { type: String, required: true },
  version: { type: String, required: true },
  info: { type: String, required: true },
  file: { type: String, required: true },
  logo: { type: String, required: true },
  labels: { type: JSON, required: true },
});

const AppModel = mongoose.model('app', applicationSchema);
module.exports = AppModel;