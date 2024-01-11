const express = require('express');
const router = express.Router();
const pool = require('../includes/database')
const { checkLoggedIn, authenticate } = require('../includes/authentication');

const getSettings = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const query = 'SELECT * FROM settings WHERE user_id = ?'
    const [ settings ] = await connection.execute(query, [ req.userId ]);
    if (settings.length !== 1) {
      res.redirect('/');
      return;
    }
    req.settings = settings[0];
    next();
  }
  catch (error) {
    // redirect to error page
    console.error(error);
  }
  finally {
    connection.release();
  }
}

router.get('/', checkLoggedIn, authenticate, getSettings, (req, res) => {
  res.render('settings', {settings: req.settings});
})

router.post('/', checkLoggedIn, authenticate, (req, res) => {
  res.send('<a href="">Return to settings</a><br>Feature still under development')
})

module.exports = router;