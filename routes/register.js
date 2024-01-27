const express = require('express');
const bcrypt = require('bcrypt');

const pool = require('../includes/database');
const { checkNotLoggedIn } = require('../includes/authentication');

const router = express.Router();

const saltRounds = 10;

router.get('/', checkNotLoggedIn, (req, res) => {
  res.render('register', {errors: {}, savedInput: {}});
})

const validateInput = (req, res, next) => {
  const { username, email, password } = req.body;
  const errors = new Object();

  if (!username || username === '') {
    errors['username'] = 'Please fill in a username';
  } else if (username.length > 32) {
    errors['username'] = `This field allows for a maximum of 32 characters (current length is ${username.length})`;
  }

  if (!email || email === '') {
    errors['email'] = 'Please fill in your email-address';
  } else if (email.length > 255) {
    errors['email'] = `This field allows for a maximum of 255 characters (current length is ${email.length})`;
  }

  if (!password || password === '') {
    errors['password'] = 'Please fill in a password';
  }

  if (Object.keys(errors).length !== 0) {
    res.render('register', {errors, savedInput: {username, email}});
    return;
  }

  next();
}

const checkDuplicateEntries = async (req, res, next) => {
  const errors = new Object();
  const { username, email } = req.body;
  let connection;

  try {
    // SELECT duplicate entries
    connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT username, email FROM users WHERE username = ? OR email = ?', [username, email]);
    
    // if no duplicates
    if (rows.length === 0) {
      next();
      return;
    }
    
    // if duplicates
    rows.forEach(row => {
      if (row['username'] === username) errors['username'] = 'Given username is already in use';
      if (row['email'] === email) errors['email'] = 'Given email is already in use';
    })
    
    if (Object.keys(errors).length === 0) {
      errors['general'] = 'An error occured while creating your account. Please try again.';
    }

    res.render('register', {errors, savedInput: {username, email}});
  }
  catch (error) {
    errors['general'] = 'An error occured while creating your account. Please try again.';
    res.render('register', {errors, savedInput: {username, email}});
    console.error(error);
  }
  finally {
    if (connection) connection.release();
  }
}

const createNewUser = async (req, res, next) => {
  const { username, email, password } = req.body;
  const errors = new Object();
  let connection;

  try {
    connection = await pool.getConnection();
    // create salt and hash
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // insert new user into database
    const newUser = [username, email, hashedPassword, salt]
    const [ result ] = await connection.execute('INSERT INTO users (username, email, password_hash, password_salt) VALUES (?, ?, ?, ?)', newUser);
    const userId = result.insertId;

    await connection.execute('INSERT INTO settings (user_id) VALUES (?)', [ userId ]);
    next();
  }
  catch (error) {
    errors['general'] = 'An error occured while creating your account. Please try again.';
    res.render('register', {errors, savedInput: {username, email}});
    console.error(error);
  }
  finally {
    if (connection) connection.release();
  }
}

router.post('/', checkNotLoggedIn, validateInput, checkDuplicateEntries, createNewUser, async (req, res) => {
  res.redirect('login');
})

module.exports = router;