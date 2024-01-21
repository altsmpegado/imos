// https://medium.com/swlh/set-up-an-express-js-app-with-passport-js-and-mongodb-for-password-authentication-6ea05d95335c
// https://javascript.plainenglish.io/session-authentication-with-node-js-express-passport-and-mongodb-ffd1eea4521c
// https://github.com/bradtraversy/mongo_file_uploads/tree/master

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const multer = require('multer');
const { GridFSBucket } = require('mongodb');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
require('dotenv').config();

// Include the user model for saving to MongoDB via mongoose
const User = require("./models/user");
const App = require("./models/app");

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection;

const app = express();

// Set up session middleware
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultSecret',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI })
}));

// Passport setup
const strategy = new LocalStrategy(User.authenticate());
passport.use(strategy);
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(passport.initialize());
app.use(passport.session());

// Check for MongoDB connection errors
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  // Connection successful, create the GridFSBucket
  const bucket = new GridFSBucket(db);

  // Set up multer for file uploads
  const storage = multer.memoryStorage();
  const upload = multer({ storage: storage });

  app.post('/upload', upload.single('file'), async (req, res) => {
    try {
      const file = req.file;
      const filename = file.originalname;
  
      const uploadStream = bucket.openUploadStream(filename);
      uploadStream.end(file.buffer);
  
      uploadStream.on('finish', async () => {
        // Get the ObjectId of the uploaded file
        const fileId = uploadStream.id;
  
        // Save app information in the database
        const new_app = new App({
          name: req.body.name,
          version: req.body.version,
          info: req.body.info,
          files: fileId,
        });
  
        await new_app.save();
  
        res.status(200).send('File uploaded successfully!');
      });
  
      uploadStream.on('error', (error) => {
        res.status(500).send('Error uploading file');
      });
    } catch (error) {
      res.status(500).send('Server error');
    }
  });

  app.get('/download/:id', async (req, res) => {
    const fileId = req.params.id;
  
    try {
      // Fetch the file info based on the object ID
      const fileInfo = await bucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
  
      if (fileInfo.length > 0) {
        const filename = fileInfo[0].filename;
  
        // Set the response headers with the filename for saving
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  
        // Create a download stream for the file
        const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
  
        // Pipe the file to the response
        downloadStream.pipe(res);
      } else {
        // File not found for the specified object ID
        res.status(404).send('File not found');
      }
    } catch (error) {
      // Handle any errors that occurred during the file fetching
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });
  
  // User registration route
  app.post('/register', (req, res) => {
    User.register(
      new User({ 
        email: req.body.email, 
        username: req.body.username 
      }), req.body.password, (err, user) => {
        if (err) {
          res.status(500).send(err.message);
        } else {
          res.status(201).send({ message: 'Registration successful', user: user });
        }
      }
    );
  });

  // User login route
  app.post('/login', passport.authenticate('local', { 
    failureRedirect: '/login-failure', 
    successRedirect: '/login-success'
  }));

  // Login failure route
  app.get('/login-failure', (req, res) => {
    res.status(401).send('Login attempt failed.');
  });

  // Login success route
  app.get('/login-success', (req, res) => {
    res.status(200).send('Login attempt was successful.');
  });

  // Start the server
  const port = process.env.PORT || 8000;
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
});
