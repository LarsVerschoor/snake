const express = require('express');

const pool = require('../includes/database');
const { checkLoggedIn, authenticate } = require('../includes/authentication');

const router = express.Router();

const getLastScore = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute('SELECT * FROM scores WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [req.userId]);
    if (rows.length === 0) {
      res.redirect('/');
      return;
    }
    const lastScoreData = rows[0];
    req.deathData = lastScoreData;
    next();
  }
  catch (error) {
    res.redirect('/');
    console.error(error);
  }
  finally {
    connection.release();
  }
}

router.get('/', checkLoggedIn, authenticate, getLastScore, (req, res) => {
  res.render('death', {deathData: req.deathData});
})

module.exports = router;