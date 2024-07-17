const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const multer = require('multer');
const { GridFSBucket } = require('mongodb');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
require('dotenv').config();

// Import database class models
const User = require("./models/user");
const App = require("./models/app");
const Submit = require("./models/sub");
const { createDockerProcess, createMultiDockerProcess, startDockerProcess, stopDockerProcess, deleteDockerProcess } = require('./serverDocker');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection;

// Create Express application
const app = express();

// Middleware setup
app.use(express.urlencoded({ extended: false }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultSecret',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI })
}));

// Passport initialization
const strategy = new LocalStrategy(User.authenticate());
passport.use(strategy);
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection error handling
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  // Initialize GridFSBucket for storing files
  const bucket = new GridFSBucket(db);

  // Multer storage configuration
  const storage = multer.memoryStorage();
  const upload = multer({ storage: storage });

  /**
   * POST route to handle file uploads.
   * Uploads files to GridFS, associates them with an App model instance.
   * @param {string} req.body.name - The name of the application.
   * @param {Object} req.files[file][0] - The main file to upload.
   * @param {Object} req.files[logo][0] - The logo file to upload.
   */
  app.post('/upload', upload.fields([{ name: 'file', maxCount: 1 }, { name: 'logo', maxCount: 1 }]), async (req, res) => {
    try {
      const existingApp = await App.findOne({ name: req.body.name });
      if (existingApp) {
        return res.status(400).send('App with this name already exists.');
      }

      const file = req.files['file'][0];
      const logo = req.files['logo'][0];

      const uploadStream = bucket.openUploadStream(file.originalname);
      uploadStream.end(file.buffer);

      uploadStream.on('finish', async () => {
        const fileId = uploadStream.id;

        const uploadLogoStream = bucket.openUploadStream(logo.originalname);
        uploadLogoStream.end(logo.buffer);

        uploadLogoStream.on('finish', async () => {
          const logoFileId = uploadLogoStream.id;

          const new_app = new App({
            name: req.body.name,
            image: req.body.image,
            type: req.body.type,
            company: req.body.company,
            version: req.body.version,
            info: req.body.info,
            file: fileId,
            logo: logoFileId,
            labels: req.body.labels
          });

          await new_app.save();

          res.status(200).send('Files uploaded successfully!');
        });

        uploadLogoStream.on('error', (error) => {
          res.status(500).send('Error uploading logo file');
        });
      });

      uploadStream.on('error', (error) => {
        res.status(500).send('Error uploading file');
      });

    } catch (error) {
      res.status(500).send('Server error');
    }
  });

  /**
   * GET route to download files from GridFS.
   * @param {string} req.params.id - The ID of the file to download.
   */
  app.get('/download/:id', async (req, res) => {
    const fileId = req.params.id;

    try {
      const fileInfo = await bucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();

      if (fileInfo.length > 0) {
        const filename = fileInfo[0].filename;

        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

        const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));

        downloadStream.pipe(res);
      } else {
        res.status(404).send('File not found');
      }
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  /**
   * Function to fetch logo file from GridFS.
   * @param {string} logoId - The ID of the logo file to fetch.
   * @returns {Promise<Buffer>} - Promise resolving to logo file content as Buffer.
   */
  async function getAppLogo(logoId) {
    try {
      const logoStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(logoId));
      const chunks = [];

      logoStream.on('data', (chunk) => {
        chunks.push(chunk);
      });

      return new Promise((resolve, reject) => {
        logoStream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        });

        logoStream.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      throw new Error('Error fetching logo file from GridFS');
    }
  };

  /**
   * GET route to fetch all apps.
   */
  app.get('/apps', async (req, res) => {
    try {
      const apps = await App.find();

      for (let app of apps) {
        const logoBuffer = await getAppLogo(app.logo);
        app.logo = logoBuffer.toString('base64');
      }

      res.status(200).json(apps);
    } catch (error) {
      console.error('Error fetching apps:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  /**
   * GET route to fetch apps owned by a specific user.
   * @param {string} req.params.user - The username of the user.
   */
  app.get('/apps/:user', async (req, res) => {
    try {
      const username = req.params.user;

      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const appsn = user.ownedApps;
      const apps = [];

      if (appsn.length !== 0) {
        for (let appn of appsn) {
          const app = await App.findOne({ name: appn });
          const logoBuffer = await getAppLogo(app.logo);
          const logoBase64 = logoBuffer.toString('base64');
          app.logo = logoBase64;
          apps.push(app);
        }
      }

      res.status(200).json({ ownedApps: apps || [] });
    } catch (error) {
      console.error('Error fetching user owned apps:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  /**
   * POST route to add an app to a user's owned apps.
   * @param {string} req.params.user - The username of the user.
   * @param {string} req.body.appName - The name of the app to add.
   */
  app.post('/apps/:user', async (req, res) => {
    try {
      const user = req.params.user;
      //console.log(req.body);
      const { appName } = req.body;
      const existingUser = await User.findOne({ username: user });

      if (existingUser) {
        if (!existingUser.ownedApps.includes(appName)) {
          existingUser.ownedApps.push(appName);

          await existingUser.save();

          res.status(200).json({ message: 'App added to owned apps successfully.' });
        } else {
          res.status(409).json({ message: 'App already exists in owned apps.' });
        }
      } else {
        res.status(404).json({ message: 'User not found.' });
      }
    } catch (error) {
      console.error('Error adding app to owned apps:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  });

  /**
   * GET route to fetch user information by username.
   * @param {string} req.params.user - The username of the user.
   */
  app.get('/user/:user', async (req, res) => {
    try {
      const username = req.params.user;

      const user = await User.findOne({ username });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ user });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  /**
   * POST route for user registration.
   * Registers a new user with provided credentials.
   * @param {string} req.body.type - The type of user (e.g., 'regular', 'admin').
   * @param {string} req.body.email - The email address of the user.
   * @param {string} req.body.username - The username of the user.
   * @param {string} req.body.password - The password of the user.
   */
  app.post('/register', (req, res) => {
    User.register(
      new User({
        type: req.body.type,
        email: req.body.email,
        username: req.body.username
      }), req.body.password, (err, user) => {
        if (err) {
          res.status(500).send(err.message);
        } else {
          res.status(201).send({ message: 'Registration Successful', user: user });
        }
      }
    );
  });

  /**
   * POST route for user login.
   * Authenticates user and starts session upon successful login.
   * @param {string} req.body.username - The username of the user.
   * @param {string} req.body.password - The password of the user.
   */
  app.post('/login', passport.authenticate('local', {
    failureRedirect: '/login-failure',
    successRedirect: '/login-success'
  }));

  // Login failure route
  app.get('/login-failure', (req, res) => {
    res.status(401).send({ message: 'Login attempt failed.' });
  });

  // Login success route
  app.get('/login-success', (req, res) => {
    res.status(200).send({ message: 'Login attempt was successful.' });
  });

  // Start the server
  const port = process.env.PORT || 8000;
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });

  /**
   * POST route to submit a file for an application.
   * Handles file upload to GridFS and creates a new submission record.
   * @param {string} req.body.appname - The name of the application.
   * @param {string} req.body.company - The company associated with the application.
   * @param {string} req.body.version - The version of the application.
   * @param {string} req.body.about - Information about the application.
   * @param {string} req.body.update - Update information for the application.
   * @param {string} req.body.info - Additional information about the submission.
   * @param {string} req.body.state - The state of the submission.
   * @param {string[]} req.body.labels - Labels associated with the submission.
   * @param {Object} req.file - The file to be uploaded.
   * @param {string} req.file.originalname - The original name of the file.
   * @param {Buffer} req.file.buffer - The file content as a buffer.
   */
  app.post('/submit', upload.single('file'), async (req, res) => {
    try {
      const file = req.file;
      const filename = file.originalname;

      const uploadStream = bucket.openUploadStream(filename);
      uploadStream.end(file.buffer);

      uploadStream.on('finish', async () => {
        const fileId = uploadStream.id;

        const new_submission = new Submit({
          appname: req.body.appname,
          company: req.body.company,
          version: req.body.version,
          about: req.body.about,
          update: req.body.update,
          info: req.body.info,
          fileId: fileId,
          state: req.body.state,
          labels: req.body.labels
        });

        await new_submission.save();

        res.status(200).json({ string: 'File submited successfully!', objectid: new_submission.id });
      });

      uploadStream.on('error', (error) => {
        res.status(500).send('Error submiting file');
      });
    } catch (error) {
      res.status(500).send('Server error');
    }
  });

  /**
   * POST route to add a submission app to a user's submissions.
   * @param {string} req.params.user - The username of the user.
   * @param {string} req.body.subId - The ID of the submission app to add.
   */
  app.post('/subs/:user', async (req, res) => {
    try {
      const user = req.params.user;
      const { subId } = req.body;
      const existingUser = await User.findOne({ username: user });

      if (existingUser) {
        if (!existingUser.subApps.includes(subId)) {
          existingUser.subApps.push(subId);

          await existingUser.save();

          res.status(200).json({ message: 'App added to submission apps successfully.' });
        } else {
          res.status(409).json({ message: 'App already exists in submission apps.' });
        }
      } else {
        res.status(404).json({ message: 'User not found.' });
      }
    } catch (error) {
      console.error('Error submiting app to sub apps:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  });

  /**
   * GET route to fetch all submission apps of a user.
   * @param {string} req.params.user - The username of the user.
   */
  app.get('/subs/:user', async (req, res) => {
    try {
      const username = req.params.user;

      const user = await User.findOne({ username });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ subApps: user.subApps || [] });
    } catch (error) {
      console.error('Error fetching user submited apps:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  /**
   * GET route to fetch details of a specific submission by ID.
   * @param {string} req.params.id - The ID of the submission.
   */
  app.get('/sub/:id', async (req, res) => {
    try {
      const id = req.params.id;

      const sub = await Submit.findOne({ _id: id });

      if (!sub) {
        return res.status(404).json({ message: 'Submission not found' });
      }

      res.status(200).json({ sub });
    } catch (error) {
      console.error('Error fetching submission:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  /**
   * GET route to fetch all cloud apps associated with a user.
   * @param {string} req.params.user - The username of the user.
   */
  app.get('/cloudapps/:user', async (req, res) => {
    try {
      const username = req.params.user;

      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const apps = user.cloudApps;

      res.status(200).json({ cloudApps: apps || [] });
    } catch (error) {
      console.error('Error fetching user owned apps:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  /**
   * PUT route to create a new cloud app for a user.
   * @param {string} req.body.user - The username of the user.
   * @param {string} req.body.app - The name of the application to create.
   * @param {string} req.body.configs - Configuration details for the cloud app.
   */
  app.put('/createapp', async (req, res) => {
    console.log("createapp PUT request")
    try {
      const user = req.body.user;
      const app = req.body.app;
      let configs = req.body.configs;

      const existingUser = await User.findOne({ username: user });
      if (!existingUser) {
        return res.status(404).send('User not found');
      }

      const existingApp = await App.findOne({ name: app });
      if (!existingApp) {
        return res.status(404).send('App not found');
      }

      configs = JSON.parse(configs);
      const type = configs.type;
      configs["username"] = user;
      configs["userappName"] = `${user}-${existingApp.image}`;

      if (existingUser.ownedApps.includes(app)) {
        if (!existingUser.cloudApps.some(cloudApp => cloudApp.app === app)) {

          if (type == "image") {
            if (createDockerProcess(configs))
              existingUser.cloudApps.push({ app, state: 'running', image: existingApp.image, type: type, container_name: `${user}-${existingApp.image}`, configs: configs });
            else {
              deleteDockerProcess(user, { type: 'image', container_name: `${user}-${existingApp.image}` });
              return res.status(400).send('Error starting cloudApp');
            }
          }
          else if (type == "multicontainer") {
            if (createMultiDockerProcess(configs))
              existingUser.cloudApps.push({ app, state: 'running', image: existingApp.image, type: type, container_name: `${user}-${existingApp.image}`, configs: configs });
            else {
              return res.status(400).send('Error starting cloudApp');
            }
          }

          await existingUser.save();
          return res.status(200).send('App added to cloudApps');
        }
        return res.status(400).send('App already in cloudApps');
      }

      return res.status(403).send('User does not own this app');
    } catch (error) {
      return res.status(500).send('Internal server error');
    }
  });

  /**
   * PUT route to start a cloud app for a user.
   * @param {string} req.body.user - The username of the user.
   * @param {string} req.body.app - The name of the application to start.
   */
  app.put('/startapp', async (req, res) => {
    try {
      const { user, app } = req.body;

      const existingUser = await User.findOne({ username: user });
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found.' });
      }

      const appIndex = existingUser.cloudApps.findIndex(cloudApp => cloudApp.app === app);
      if (appIndex === -1) {
        return res.status(409).json({ message: 'App does not exist in cloud apps.' });
      }

      if (existingUser.cloudApps[appIndex].state == "stopped") {
        if (startDockerProcess(existingUser.cloudApps[appIndex])) {
          existingUser.cloudApps[appIndex].state = "running";
        }
        await existingUser.save();
        return res.status(200).json({ message: 'App started successfully!' });
      }

      else {
        return res.status(401).json({ message: 'App is already running' });
      }

    } catch (error) {
      console.error('Error starting app from cloud apps:', error);
      return res.status(500).json({ message: 'Server error.' });
    }
  });

  /**
   * PUT route to stop a cloud app for a user.
   * @param {string} req.body.user - The username of the user.
   * @param {string} req.body.app - The name of the application to stop.
   */
  app.put('/stopapp', async (req, res) => {
    try {
      const { user, app } = req.body;

      const existingUser = await User.findOne({ username: user });
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found.' });
      }

      const appIndex = existingUser.cloudApps.findIndex(cloudApp => cloudApp.app === app);
      if (appIndex === -1) {
        return res.status(409).json({ message: 'App does not exist in cloud apps.' });
      }

      if (existingUser.cloudApps[appIndex].state == "running") {
        if (stopDockerProcess(existingUser.cloudApps[appIndex])) {
          existingUser.cloudApps[appIndex].state = "stopped";
        }
        await existingUser.save();
        return res.status(200).json({ message: 'App stoped successfully!' });
      }

      else {
        return res.status(401).json({ message: 'App is not running' });
      }

    } catch (error) {
      console.error('Error stoping app from cloud apps:', error);
      return res.status(500).json({ message: 'Server error.' });
    }
  });

  /**
   * DELETE route to remove a cloud app from a user's cloudApps.
   * @param {string} req.body.user - The username of the user.
   * @param {string} req.body.app - The name of the application to remove.
   */
  app.delete('/removeapp', async (req, res) => {
    try {
      const { user, app } = req.body;

      const existingUser = await User.findOne({ username: user });
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found.' });
      }

      const appIndex = existingUser.cloudApps.findIndex(cloudApp => cloudApp.app === app);
      if (appIndex === -1) {
        return res.status(409).json({ message: 'App does not exist in cloud apps.' });
      }

      if (deleteDockerProcess(user, existingUser.cloudApps[appIndex])) {
        existingUser.cloudApps.splice(appIndex, 1);
        await existingUser.save();
        return res.status(200).json({ message: 'App removed from cloud apps successfully!' });
      }

      return res.status(400).json({ message: 'Error removing app from cloudApps, app is still running.' });
    } catch (error) {
      console.error('Error removing app from cloud apps:', error);
      return res.status(500).json({ message: 'Server error.' });
    }
  });

});