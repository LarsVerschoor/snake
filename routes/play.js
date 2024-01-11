const express = require('express');

const pool = require('../includes/database.js');
const { checkLoggedIn, authenticate } = require('../includes/authentication.js');

const router = express.Router();

const getSettings = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const query = 'SELECT * FROM settings WHERE user_id = ?';
    const [ settings ] = await connection.execute(query, [req.userId]);
    
    if (settings.length !== 1) {
      res.redirect('/');
      return;
    }

    req.settings = settings[0];
    next();
  }
  catch (error) {
    console.error(error);
    res.redirect('/');
    // TODO: redirect to error screen
  }
  finally {
    connection.release();
  }
}

router.get('/', checkLoggedIn, authenticate, getSettings, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    if (!req.query.gamemode) {
      res.redirect('/select-gamemode');
      return;
    }

    const queryGamemodeId = req.query.gamemode;

    if (!Number.isSafeInteger(Number(queryGamemodeId))) {
      res.redirect('/select-gamemode');
      return;
    }

    const checkGamemodeIdQuery = 'SELECT * FROM gamemodes WHERE id = ?';
    const [ resultGamemodes ] = await connection.execute(checkGamemodeIdQuery, [queryGamemodeId]);
    if (resultGamemodes.length !== 1) {
      res.redirect('/select-gamemode');
      return;
    }


    const query = `
    SELECT
    gamemodes.id,
    gamemodes.name,
    gamemodes.speed,
    gamemodes.food_amount,
    gamemodes.obstacle_amount,
    gamemodes.walls,
    scores.score AS highscore 
    FROM gamemodes
    LEFT JOIN scores
    ON scores.gamemode_id = gamemodes.id AND scores.user_id = ?
    WHERE gamemodes.id = ?
    ORDER BY scores.score DESC
    LIMIT 1`;
    const [ gamemodeData ] = await connection.execute(query, [req.userId, queryGamemodeId]);
    if (gamemodeData.length === 0) {
      res.redirect('/select-gamemode');
      return;
    }
    res.render('play', {gamemode: gamemodeData[0], settings: req.settings});
  }
  catch {
    res.redirect('/select-gamemode');
  }
  finally {
    connection.release();
  }
})

const validateFormData = (req, res, next) => {
  if (!req.body['gameoverData']) {
    res.redirect('/select-gamemode');
    return;
  }

  const { gamemode_id, score, death_message } = req.body['gameoverData'];

  if ( !gamemode_id || !score || !death_message ) {
    res.redirect('/select-gamemode');
    return;
  }

  next();
}

const storeScore = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { gamemode_id, score, death_message } = req.body['gameoverData'];
    await connection.execute('INSERT INTO scores (gamemode_id, user_id, score, death_message) VALUES (?, ?, ?, ?)', [gamemode_id, req.userId, score, death_message]);
    next();
  }
  catch (error) {
    res.redirect('/select-gamemode');
    console.error(error);
  }
  finally {
    connection.release();
  }
}

router.post('/', checkLoggedIn, authenticate, validateFormData, storeScore, (req, res) => {
  res.status(200).json(JSON.stringify({
    succes: 'succes'
  }))
})

module.exports = router;