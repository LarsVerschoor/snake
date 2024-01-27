const express = require('express');
const bcrypt = require('bcrypt');
const uuid = require('uuid');

const pool = require('../includes/database');
const { checkNotLoggedIn } = require('../includes/authentication');

const router = express.Router();

router.get('/', checkNotLoggedIn, (req, res) => {
  res.render('login', {errors: {}, savedInput: {}});
})

const validateInput = (req, res, next) => {
  const { username, password } = req.body;
  const errors = new Object();

  if (!username || username === '') {
    errors['username'] = 'Please fill in your username';
  } else if (username.length > 32) {
    errors['username'] = `This field allows for a maximum of 32 characters (current length is ${username.length})`;
  }

  if (!password || password === '') {
    errors['password'] = 'please fill in your password';
  }

  if (Object.keys(errors).length !== 0) {
    res.render('login', {errors, savedInput: { username }});
    return;
  }
  next();
}

const checkMatch = async (req, res, next) => {
  const { username, password } = req.body;
  const errors = new Object();
  let connection;

  try {
    // SELECT user from database
    connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT username, password_hash FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      errors['general'] = 'Username and password combination is incorrect, Please try again.';
      res.render('login', {errors, savedInput: { username }});
      return;
    }

    // compare passwords
    const hashedDatabasePassword = rows[0]['password_hash'];
    
    if (!await bcrypt.compare(password, hashedDatabasePassword)) {
      errors ['general'] = 'Username and password combination is incorrect. Please try again.';
      res.render('login', {errors, savedInput: { username }});
      return;
    }
    next();
  }
  catch (error) {
    console.error(error);
    errors['general'] = 'An error occured while checking your credentials. Please try again later.';
    res.render('login', {errors, savedInput: { username }});
  }
  finally {
    if (connection) connection.release();
  }
}

const initializeSession = async (req, res, next) => {
  const { username } = req.body;
  const errors = new Object();
  let connection;

  try {
    connection = await pool.getConnection();
    const expirationTimeInMilliSeconds = 15 * 60 * 60 * 1000; //15hr

    // generate 16-byte cookie
    const newSessionIdCookie = uuid.v4();
    const expiryDate = new Date(new Date().getTime() + expirationTimeInMilliSeconds);

    // get user id from database
    const [users] = await connection.execute('SELECT id FROM users WHERE username = ?', [username]);
    const userId = users[0]['id'];

    // storing session in database
    await connection.execute('INSERT INTO sessions (user_id, authentication_cookie, expiry_time) VALUES(?, ?, ?)', [userId, newSessionIdCookie, expiryDate]);

    // assign cookie to user
    res.cookie('session_authentication', newSessionIdCookie, {
      maxAge: expirationTimeInMilliSeconds, // 24h
      httpOnly: true
    });
    next();
  }
  catch (error) {
    console.error(error);
    errors['general'] = errors['general'] = 'An error occured while logging you in. Please try again.';
    res.render('login', {errors, savedInput: { username }});
  }
  finally {
    if (connection) connection.release();
  }
}

router.post('/', checkNotLoggedIn, validateInput, checkMatch, initializeSession, (req, res) => {
  res.redirect('/')
})

module.exports = router;