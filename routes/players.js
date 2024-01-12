const express = require('express');

const pool = require('../includes/database');
const { checkLoggedIn, authenticate } = require('../includes/authentication');

const router = express.Router();

const getPlayers = async (req, res, next) => {
  try {
    const connection = await pool.getConnection();
    try {

      // Validation
      if (!req.query.q || req.query.q === '' || req.query.q.length > 32) {
        req.searchResults = [];
        next();
        return;
      }

      // Set variable in mysql database
      await connection.execute('SET @search_term = ?', [ req.query.q ]);

      // Get search results from database
      const query = `
      SELECT username, created_at, COUNT(scores.user_id) AS games_played
      LEFT JOIN scores ON scores.user_id = users.id
      WHERE username = ?
      GROUP BY username, created_at`;
      const [ searchResults ] = await connection.execute(query);

      req.searchResults = searchResults;
      next();
    }
    catch(error) {
      res.render('players', { results: [], errors: { general: 'An unexpected error occured at the server. Please try again later.' } })
      console.error(error);
    }
    finally {
      connection.release();
    }
  }
  catch(error) {
    res.render('players', { results: [], errors: { general: 'An unexpected error occured at the server. Please try again later.' } })
    console.error(error);
  }
}

router.get('/', checkLoggedIn, authenticate, getPlayers, (req, res) => {
  res.render('players', { errors: {}, results: req.searchResults });
})

module.exports = router;