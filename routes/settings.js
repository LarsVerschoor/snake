const express = require('express');
const router = express.Router();
const { checkLoggedIn, authenticate } = require('../includes/authentication');

router.get('/', checkLoggedIn, authenticate, (req, res) => {
  res.render('settings');
})

router.post('/', checkLoggedIn, authenticate, (req, res) => {
  res.send('<a href="">Return to settings</a><br>Feature still under development')
})

module.exports = router;