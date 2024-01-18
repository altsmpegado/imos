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

  // Define your file upload route
  app.post('/upload', upload.single('file'), (req, res) => {
    const file = req.file;
    const filename = file.originalname;

    const uploadStream = bucket.openUploadStream(filename);
    uploadStream.end(file.buffer);

    uploadStream.on('finish', () => {
      res.status(200).send('File uploaded successfully!');
    });

    uploadStream.on('error', (error) => {
      res.status(500).send('Error uploading file');
    });
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
