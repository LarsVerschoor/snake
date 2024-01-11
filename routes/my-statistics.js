const express = require('express');
const pool = require('../includes/database');
const { checkLoggedIn, authenticate } = require('../includes/authentication');

const router = express.Router();

const getStatistics = async (req, res, next) => {
  req.statistics = {
    totalGamesPlayed: 69,
    avarageScore: 38
  }
  next();
}

router.get('/', checkLoggedIn, authenticate, getStatistics, (req, res) => {
  res.render('my-statistics', {statistics: req.statistics});
})

module.exports = router;