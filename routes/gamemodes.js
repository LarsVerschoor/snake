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

router.get('/:gamemodeName/play', checkLoggedIn, authenticate, getSettings, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const paramsGamemodeName = req.params.gamemodeName;

    const checkGamemodeIdQuery = 'SELECT * FROM gamemodes WHERE name = ?';
    const [ resultGamemodes ] = await connection.execute(checkGamemodeIdQuery, [paramsGamemodeName]);
    if (resultGamemodes.length !== 1) {
      res.redirect('/gamemodes');
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
      WHERE gamemodes.name = ?
      ORDER BY scores.score DESC
      LIMIT 1`;
    const [ gamemodeData ] = await connection.execute(query, [req.userId, paramsGamemodeName]);
    if (gamemodeData.length === 0) {
      res.redirect('/gamemodes');
      return;
    }
    res.render('play', {gamemode: gamemodeData[0], settings: req.settings});
  }
  catch {
    res.redirect('/gamemodes');
  }
  finally {
    connection.release();
  }
})

const getHighscores = async (req, res, next) => {
  try {
    const connection = await pool.getConnection();
    try {
      // TODO: checken of params gamemode bestaat
      const paramsGamemodeName = req.params.gamemodeName;

      const query = `
        SELECT users.username, scores.score, DATE_FORMAT(scores.created_at, '%Y-%m-%d %H:%i:%s') AS created_at
        FROM scores
        INNER JOIN users ON scores.user_id = users.id
        INNER JOIN gamemodes ON scores.gamemode_id = gamemodes.id
        WHERE gamemodes.name = ?
        AND scores.score = (
          SELECT MAX(score)
          FROM scores
          INNER JOIN gamemodes ON scores.gamemode_id = gamemodes.id
          WHERE user_id = users.id
          AND gamemodes.name = ?
        )
        ORDER BY scores.score DESC,
        scores.created_at ASC
        LIMIT 5`;

        const [ highscores ] = await connection.execute(query, [paramsGamemodeName, paramsGamemodeName])
        req.highscores = highscores
        next()
    }
    catch (error) {
      res.redirect('/gamemodes');
      console.error(error)
    }
    finally {
      connection.release();
    }
  }
  catch (error) {
    // error page
    res.redirect('/gamemodes');
    console.error(error)
  }
}

router.get('/:gamemodeName', checkLoggedIn, authenticate, getHighscores, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const paramsGamemodeName = req.params.gamemodeName;
      const query = `
        SELECT
        gamemodes.id,
        gamemodes.name,
        gamemodes.speed,
        gamemodes.food_amount,
        gamemodes.obstacle_amount,
        gamemodes.walls,
        DATE_FORMAT(gamemodes.created_at, '%Y-%m-%d') AS created_at,
        scores.score AS highscore 
        FROM gamemodes
        LEFT JOIN scores
        ON scores.gamemode_id = gamemodes.id AND scores.user_id = ?
        WHERE gamemodes.name = ?
        ORDER BY scores.score DESC
        LIMIT 1`;
      const [ gamemodeData ] = await connection.execute(query, [ req.userId, paramsGamemodeName ]);

      if (gamemodeData.length === 0) {
        res.redirect('/gamemodes');
      }

      res.render('gamemode', { gamemode: gamemodeData[0], highscores: req.highscores });
    }
    catch (error) {
      // error page
      res.redirect('/gamemodes');
      console.error(error);
    }
    finally {
      connection.release();
    }
  }
  catch(error) {
    // error page
    console.error(error)
  }
})

const validateFormData = (req, res, next) => {
  if (!req.body['gameoverData']) {
    res.redirect('/gamemodes');
    return;
  }

  const { gamemode_id, score, death_message } = req.body['gameoverData'];

  if ( !gamemode_id || !score || !death_message ) {
    res.redirect('/gamemodes');
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
    res.redirect('/gamemodes');
    console.error(error);
  }
  finally {
    connection.release();
  }
}

router.post('/:gamemodeId/play', checkLoggedIn, authenticate, validateFormData, storeScore, (req, res) => {
  res.status(200).json(JSON.stringify({
    succes: 'succes'
  }))
})

// select-gamemode if no gamemode param is given

const getGamemodes = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const query = `
    SELECT
      gamemodes.name,
      gamemodes.speed,
      gamemodes.food_amount,
      gamemodes.obstacle_amount,
      gamemodes.walls,
      IF(likes.gamemode_id IS NOT NULL, 1, 0) AS liked,
      IF(pins.gamemode_id IS NOT NULL, 1, 0) AS pinned,
      COALESCE(likes_count.likes_count, 0) AS likes_count,
      COALESCE(pins_count.pins_count, 0) AS pins_count
    FROM
      gamemodes
    LEFT JOIN
      likes ON likes.gamemode_id = gamemodes.id AND likes.user_id = ?
    LEFT JOIN
      pins ON pins.gamemode_id = gamemodes.id AND pins.user_id = ?
    LEFT JOIN (
      SELECT gamemode_id, COUNT(*) AS likes_count
      FROM likes
      GROUP BY gamemode_id
    ) likes_count ON likes_count.gamemode_id = gamemodes.id
    LEFT JOIN (
      SELECT gamemode_id, COUNT(*) AS pins_count
      FROM pins
      GROUP BY gamemode_id 
    ) pins_count ON pins_count.gamemode_id = gamemodes.id
    ORDER BY
      pinned DESC,
      gamemodes.created_at ASC,
      gamemodes.id ASC`;

    const [gamemodes] = await connection.execute(query, [req.userId, req.userId]);
    req.gamemodes = gamemodes;
    next();
  }
  catch (error) {
    console.error(error);
    res.redirect('/');
  }
  finally {
    connection.release();
  }
}

router.get('/', checkLoggedIn, authenticate, getGamemodes, (req, res) => {
  const gamemodes = req.gamemodes;
  res.render('select-gamemode', { gamemodes });
});

module.exports = router;