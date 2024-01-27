const express = require('express');

const pool = require('../includes/database');
const { checkLoggedIn, authenticate } = require('../includes/authentication');

const router = express.Router();

const getLastScore = async (req, res, next) => {
  let connection
  try {
    connection = await pool.getConnection();
    const query = `
      SELECT * FROM scores
      INNER JOIN gamemodes ON scores.gamemode_id = gamemodes.id
      WHERE user_id = ?
      ORDER BY scores.created_at DESC
      LIMIT 1`
    const [rows] = await connection.execute(query, [req.userId]);
    if (rows.length === 0) {
      // snake has never died before so death page should not exist
      res.redirect('/404.html');
      return;
    }
    const lastScoreData = rows[0];
    req.deathData = lastScoreData;
    next();
  }
  catch (error) {
    res.redirect('/error.html');
    console.error(error);
  }
  finally {
    if (connection) connection.release();
  }
}

router.get('/', checkLoggedIn, authenticate, getLastScore, (req, res) => {
  res.render('death', {deathData: req.deathData});
})

router.get('/*', (req, res) => {
  res.redirect('/404.html');
})

module.exports = router;