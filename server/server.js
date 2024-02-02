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
const Submit = require("./models/sub");

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
      // Check if the app with the given name already exists
      const existingApp = await App.findOne({ name: req.body.name });
      if (existingApp) {
        return res.status(400).send('App with this name already exists.');
      }

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
          company: req.body.company,
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
  
  app.get('/apps', async (req, res) => {
    try {
      const apps = await App.find();
      res.json(apps);
    } catch (error) {
      console.error('Error fetching apps:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.get('/apps/:user', async (req, res) => {
    try {
      const username = req.params.user;
  
      // Find the user by username
      const user = await User.findOne({ username });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Return the owned apps list for the user
      res.status(200).json({ ownedApps: user.ownedApps || [] });
    } catch (error) {
      console.error('Error fetching user owned apps:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  app.post('/apps/:user', async (req, res) => {
    try {
      // Find the user by username
      const user = req.params.user;
      //console.log(req.body);
      const { appName } = req.body;
      const existingUser = await User.findOne({ username: user });
      
      if (existingUser) {
        // Check if the app is not already in the owned apps list
        if (!existingUser.ownedApps.includes(appName)) {
          // Append the new app to the user's owned apps
          existingUser.ownedApps.push(appName);

          // Save the updated user document
          await existingUser.save();

          // Send a success response
          res.status(200).json({ message: 'App added to owned apps successfully.' });
        } else {
          // If the app is already in the owned apps list, send a conflict response
          res.status(409).json({ message: 'App already exists in owned apps.' });
        }
      } else {
        // If the user is not found, send a not found response
        res.status(404).json({ message: 'User not found.' });
      }
    } catch (error) {
      // Handle any server error
      console.error('Error adding app to owned apps:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  });

  app.get('/user/:user', async (req, res) => {
    try {
      const username = req.params.user;
  
      // Find the user by username
      const user = await User.findOne({ username });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Return the owned apps list for the user
      res.status(200).json({ user });
    } catch (error) {
      console.error('Error fetching user owned apps:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  // User registration route
  app.post('/register', (req, res) => {
    User.register(
      new User({ 
        type: req.body.type,
        email: req.body.email, 
        username: req.body.username,
        ownedApps:  req.body.ownedApps
      }), req.body.password, (err, user) => {
        if (err) {
          res.status(500).send(err.message);
        } else {
          res.status(201).send({ message: 'Registration Successful', user: user });
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

  app.post('/submit', upload.single('file'), async (req, res) => {
    try {
      const file = req.file;
      const filename = file.originalname;
  
      const uploadStream = bucket.openUploadStream(filename);
      uploadStream.end(file.buffer);
  
      uploadStream.on('finish', async () => {
        // Get the ObjectId of the uploaded file
        const fileId = uploadStream.id;
  
        // Save app information in the database
        const new_submission = new Submit({
          appname: req.body.appname,
          company: req.body.company,
          version: req.body.version,
          about: req.body.about,
          update : req.body.update,
          info: req.body.info,
          fileId: fileId,
          state: req.body.state
        });
  
        await new_submission.save();
  
        res.status(200).send('File submited successfully!');
      });
  
      uploadStream.on('error', (error) => {
        res.status(500).send('Error submiting file');
      });
    } catch (error) {
      res.status(500).send('Server error');
    }
  });

});
