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
      SELECT users.username, users.created_at, COUNT(scores) AS games_played
      FROM users
      LEFT JOIN scores ON scores.user_id = users.id
      WHERE LOWER(username) LIKE LOWER(CONCAT('%', @search_term, '%'))
      GROUP BY users.username, users.created_at
      ORDER BY CASE
        WHEN username LIKE @search_term THEN 01
        WHEN LOWER(username) LIKE LOWER(@search_term) THEN 2
        WHEN username LIKE CONCAT(@search_term, '%') THEN 3
        WHEN LOWER(username) LIKE LOWER(CONCAT(@search_term, '%')) THEN 4
        WHEN username LIKE CONCAT('%', @search_term, '%') THEN 5
        WHEN LOWER(username) LIKE LOWER(CONCAT('%', @search_term, '%')) THEN 6
      END;`;
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