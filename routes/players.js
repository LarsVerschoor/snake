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

      // Get search results from database
      const query = `
      SELECT users.username, DATE_FORMAT(users.created_at, '%Y-%m-%d') AS date_created, COUNT(scores.user_id) AS games_played
      FROM users
      LEFT JOIN scores ON scores.user_id = users.id
      WHERE LOWER(username) LIKE CONCAT('%', LOWER(?), '%') 
      GROUP BY users.username, date_created
      ORDER BY games_played ASC`;
      const [ searchResults ] = await connection.execute(query, [ req.query.q ]);

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