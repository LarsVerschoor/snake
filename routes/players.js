const express = require('express');

const pool = require('../includes/database');
const { checkLoggedIn, authenticate } = require('../includes/authentication');

const router = express.Router();

const getPlayers = async (req, res, next) => {
  let connection;
  try {
    // Validation
    if (!req.query.q || req.query.q === '' || req.query.q.length > 32) {
      req.searchResults = [];
      next();
      return;
    }
    
    // Get search results from database
    connection = await pool.getConnection();
    const query = `
    SELECT users.username, DATE_FORMAT(users.created_at, '%Y-%m-%d') AS date_created, COUNT(scores.user_id) AS games_played
    FROM users
    LEFT JOIN scores ON scores.user_id = users.id
    WHERE LOWER(username) LIKE CONCAT('%', LOWER(?), '%') 
    GROUP BY users.username, date_created
    ORDER BY games_played DESC`;
    const [ searchResults ] = await connection.execute(query, [ req.query.q ]);

    req.searchResults = searchResults;
    next();
  }
  catch(error) {
    res.render('players', { results: [], errors: { general: 'An unexpected error occured at the server. Please try again later.' } })
    console.error(error);
  }
  finally {
    if (connection) connection.release();
  }
}

const getTargetPlayerId = async (req, res, next) => {
  try {
    const connection = await pool.getConnection();
    try {
      const targetPlayerName = req.params.playerName;
      const query = 'SELECT id FROM users WHERE username = ?';
      const [ results ] = await connection.execute(query, [ targetPlayerName ]);
      if (results.length !== 1) {
        res.status(404).redirect('/404.html');
        return;
      }
      req.targetPlayerId = results[0].id;
      next();
    }
    catch {
      res.status(500).redirect('/error.html');
      console.error(error);
    }
    finally {
      connection.release();
    }
  }
  catch (error) {
    res.status(500).redirect('/error.html');
    console.error(error);
  }
}

const getPlayerPlayedAmount = async (req, res, next) => {
  try {
    const connection = await pool.getConnection();
    try {
      const targetPlayerId = req.targetPlayerId;
      const query = 'SELECT COUNT(*) as games_played FROM scores WHERE user_id = ?';
      const [ results ] = await connection.execute(query, [ targetPlayerId ]);
      if (results.length !== 1) {
        res.status(404).redirect('/404.html');
        return;
      }
      req.playerPlayedAmount = results[0].games_played;
      next();
    }
    catch {
      res.status(500).redirect('/error.html');
      console.error(error);
    }
    finally {
      connection.release();
    }
  }
  catch (error) {
    res.status(500).redirect('/error.html');
    console.error(error);
  }
}

const getPlayerHighscores = async (req, res, next) => {
  try {
    const connection = await pool.getConnection();
    try {
      const targetPlayerId = req.targetPlayerId;
      const query = `
      SELECT gamemodes.name AS gamemode_name, COALESCE(scores.score, 0) AS highscore, scores.created_at
      FROM gamemodes
      LEFT JOIN (
          SELECT gamemode_id, MAX(score) AS score, DATE_FORMAT(scores.created_at, '%Y-%m-%d %H:%i:%s') AS created_at FROM scores
          WHERE user_id = ? GROUP BY gamemode_id, created_at
      ) scores ON gamemodes.id = scores.gamemode_id ORDER BY score DESC`;
      const [ results ] = await connection.execute(query, [targetPlayerId]);
      req.playerHighscores = results;
      next();
    }
    catch (error) {
      res.status(500).redirect('/error.html');
      console.error(error);
    }
    finally {
      connection.release();
    }
  }
  catch (error) {
    res.status(500).redirect('/error.html');
    console.error(error);
  }
}

const getPlayerData = async (req, res, next) => {
  try {
    const connection = await pool.getConnection();
    try {
      const targetPlayerId = req.targetPlayerId;
      const query = 'SELECT * FROM users WHERE id = ?';
      const [ results ] = await connection.execute(query, [ targetPlayerId ]);
      if (results.length !== 1) {
        res.status(404).redirect('/404.html');
        return;
      }
      req.playerData = results[0];
      next();
    }
    catch (error) {
      res.status(500).redirect('/error.html');
      console.error(error);
    }
    finally {
      connection.release();
    }
  }
  catch (error) {
    res.status(500).redirect('/error.html')
    console.error(error);
  }
}

router.get('/', checkLoggedIn, authenticate, getPlayers, (req, res) => {
  res.render('players', { errors: {}, results: req.searchResults });
})

router.get('/:playerName/profile', checkLoggedIn, authenticate, getTargetPlayerId, getPlayerPlayedAmount, getPlayerHighscores, getPlayerData, (req, res) => {
  res.render('player-profile', { gamesPlayed: req.playerPlayedAmount, highscores: req.playerHighscores, player: req.playerData });
})

router.get('/:playerName', (req, res) => {
  res.redirect('/players/playerName/profile');
})

module.exports = router;