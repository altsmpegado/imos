// https://medium.com/swlh/set-up-an-express-js-app-with-passport-js-and-mongodb-for-password-authentication-6ea05d95335c
// https://javascript.plainenglish.io/session-authentication-with-node-js-express-passport-and-mongodb-ffd1eea4521c

// Include express and passport packages.
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// Include the user model for saving to MongoDB VIA mongoose
const User = require("./models/user");

// MongoDB connection
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const mongoString = 'mongodb+srv://altsmpegado:31rRoBfJYTCKVZ0t@imos-cluster.lle7hy4.mongodb.net/server';

require('dotenv').config();

mongoose.connect(mongoString);
const db = mongoose.connection;

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultSecret',
  resave: false,
  saveUninitialized: true,
  store: new MongoStore({ mongoUrl: db.client.s.url })
}));

// Passport
const strategy = new LocalStrategy(User.authenticate())
passport.use(strategy);
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(passport.initialize());
app.use(passport.session());

/*
  Beyond this point is all system specific routes.
  All routes are here for simplicity of understanding the tutorial
  /register -- Look closer at the package https://www.npmjs.com/package/passport-local-mongoose
  for understanding why we don't try to encrypt the password within our application
*/
app.post('/register', function (req, res) {
  User.register(
    new User({ 
      email: req.body.email, 
      username: req.body.username 
    }), req.body.password, function (err, msg) {
      if (err) {
        res.send(err);
      } else {
        res.send({ message: "Successful" });
      }
    }
  )
})

/*
  Login routes -- This is where we will use the 'local'
  passport authenciation strategy. If success, send to
  /login-success, if failure, send to /login-failure
*/
app.post('/login', passport.authenticate('local', { 
  failureRedirect: '/login-failure', 
  successRedirect: '/login-success'
}), (err, req, res, next) => {
  if (err) next(err);
});

app.get('/login-failure', (req, res, next) => {
  console.log(req.session);
  res.send('Login Attempt Failed.');
});

app.get('/login-success', (req, res, next) => {
  console.log(req.session);
  res.send('Login Attempt was successful.');
});

app.listen(8000, () => { console.log('Server started.') });