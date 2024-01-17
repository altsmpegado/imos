// https://github.com/bradtraversy/mongo_file_uploads/tree/master

const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Connect to MongoDB (replace with your MongoDB connection string)
const mongoString = process.env.MONGODB_URI;
mongoose.connect('mongodb://localhost:27017/fileuploader');

// Create a Mongoose model for storing files
const File = mongoose.model('File', {
  originalname: String,
  mimetype: String,
  size: Number,
  buffer: Buffer,
});

// Set up Multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Endpoint for file upload
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { originalname, mimetype, size, buffer } = req.file;

    // Save the file to MongoDB
    const file = new File({
      originalname,
      mimetype,
      size,
      buffer,
    });

    await file.save();

    return res.status(201).json({ message: 'File uploaded successfully!' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
