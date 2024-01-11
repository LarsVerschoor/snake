const express = require('express');
const router = express.Router();
const { checkLoggedIn, authenticate } = require('../includes/authentication');

router.get('/', checkLoggedIn, authenticate, (req, res) => {
  res.render('players');
})

module.exports = router;