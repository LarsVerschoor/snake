const express = require('express');

const pool = require('../includes/database');
const { checkLoggedIn, authenticate } = require('../includes/authentication');

const router = express.Router();

const getDailyHighscores = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const query = `
      SELECT 
        gamemodes.id AS gamemode_id,
        gamemodes.name AS gamemode,
        COALESCE(users.username, '-') AS username, 
        COALESCE(scores.score, '-') AS score, 
        COALESCE(scores.created_at, '-') AS created_at 
      FROM gamemodes 
      LEFT JOIN (
        SELECT 
          gamemode_id, 
          user_id, 
          score, 
          created_at
        FROM (
          SELECT 
            gamemode_id, 
            user_id, 
            score, 
            created_at,
            ROW_NUMBER() OVER (PARTITION BY gamemode_id ORDER BY score DESC, created_at ASC) AS score_rank
          FROM scores 
          WHERE created_at >= NOW() - INTERVAL 24 HOUR 
        ) ranked_scores
        WHERE score_rank = 1
      ) scores ON gamemodes.id = scores.gamemode_id
      LEFT JOIN users ON scores.user_id = users.id
      ORDER BY scores.score DESC`;
    const [ dailyHighscores ] = await connection.execute(query);

    req.dailyHighscores = dailyHighscores;
    next();
  }
  catch (error) {
    console.error(error);
    // redirect to error page
  }
  finally {
    connection.release();
  }
}

const getAllTimeHighscores = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const query = `
      SELECT 
        gamemodes.id AS gamemode_id,
        gamemodes.name AS gamemode,
        COALESCE(users.username, '-') AS username, 
        COALESCE(scores.score, '-') AS score, 
        COALESCE(scores.created_at, '-') AS created_at 
      FROM gamemodes 
      LEFT JOIN (
        SELECT 
          gamemode_id, 
          user_id, 
          score, 
          created_at
        FROM (
          SELECT 
            gamemode_id, 
            user_id, 
            score, 
            created_at,
            ROW_NUMBER() OVER (PARTITION BY gamemode_id ORDER BY score DESC, created_at ASC) AS score_rank
          FROM scores 
        ) ranked_scores
        WHERE score_rank = 1
      ) scores ON gamemodes.id = scores.gamemode_id
      LEFT JOIN users ON scores.user_id = users.id
      ORDER BY scores.score DESC,
      gamemodes.id ASC`;
    const [ allTimeHighscores ] = await connection.execute(query);

    req.allTimeHighscores = allTimeHighscores;
    next();
  }
  catch (error) {
    console.error(error);
    // redirect to error page
  }
  finally {
    connection.release();
  }
}

router.get('/', checkLoggedIn, authenticate, getDailyHighscores, getAllTimeHighscores, (req, res) => {
  res.render('index', { dailyHighscores: req.dailyHighscores, allTimeHighscores: req.allTimeHighscores });
})

module.exports = router;