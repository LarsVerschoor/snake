const express = require('express');

const pool = require('../includes/database.js');
const { checkLoggedIn, authenticate } = require('../includes/authentication.js');

const router = express.Router();


// --- MIDDLEWARES ---

const fetchLoggedInUserSettings = async (req, res, next) => {
  // get all settings from the logged in user
  let connection;
  try {
    connection = await pool.getConnection();
    const query = 'SELECT * FROM settings WHERE user_id = ?';
    const [ settings ] = await connection.execute(query, [req.userId]);
    
    if (settings.length !== 1) {
      res.redirect('/error.html');
      return;
    }

    req.settings = settings[0];
    next();
  }
  catch (error) {
    console.error(error);
    res.redirect('/error.html');
  }
  finally {
    if (connection) connection.release();
  }
}

const checkGamemodeExistsByName = async (req, res, next) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const paramsGamemode = req.params.gamemodeName;
    const query = 'SELECT * FROM gamemodes WHERE name = ?';
    const [ matches ] = await connection.execute(query, [ paramsGamemode ]);
    if (matches.length === 1) {
      next();
      return;
    }
    res.redirect('/404.html');
  }
  catch (error) {
    res.redirect('/error.html')
    console.error(error);
  }
  finally {
    if (connection) connection.release();
  }
}

const fetchGlobalHighscoresOfGamemode = async (req, res, next) => {
  // get the top 5 global highscores of one gamemode
  let connection;
  try {
    connection = await pool.getConnection();
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
      req.globalHighscoresOfGamemode = highscores
      next()
  }
  catch (error) {
    res.redirect('/gamemodes');
    console.error(error)
  }
  finally {
    if (connection) connection.release();
  }
}

const fetchDataOfGamemode = async (req, res, next) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const paramsGamemodeName = req.params.gamemodeName;
    const query = `
      SELECT g.id, g.name, g.speed, g.food_amount, g.obstacle_amount, g.walls,
      DATE_FORMAT(g.created_at, '%Y-%m-%d') AS created_at,
      COALESCE(s.score, 0) AS highscore 
      FROM gamemodes g
      LEFT JOIN scores s ON s.gamemode_id = g.id AND s.user_id = ?
      WHERE g.name = ? ORDER BY s.score DESC LIMIT 1`;
    const [ gamemodeData ] = await connection.execute(query, [ req.userId, paramsGamemodeName ]);

    if (gamemodeData.length === 0) {
      res.redirect('/gamemodes');
      return;
    }

    req.gamemodeData = gamemodeData[0];
    next();
  }
  catch (error) {
    // error page
    res.redirect('/error.html');
    console.error(error);
  }
  finally {
    if (connection) connection.release();
  }
}

const validateNewScoreRequest = (req, res, next) => {
  // validate the post body
  // TODO: checken of de gamemode bestaat, checken of de score valid is, checken of death message valid is.
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

const storeScoreInDatabase = async (req, res, next) => {
  // stores the posted score in the database after the validation middleware
  let connection;
  try {
    connection = await pool.getConnection();
    const { gamemode_id, score, death_message } = req.body['gameoverData'];
    await connection.execute('INSERT INTO scores (gamemode_id, user_id, score, death_message) VALUES (?, ?, ?, ?)', [gamemode_id, req.userId, score, death_message]);
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

const fetchDataOfAllGamemodes = async (req, res, next) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const query = `
    SELECT gamemodes.name,
      gamemodes.speed,
      gamemodes.food_amount,
      gamemodes.obstacle_amount,
      gamemodes.walls,
      IF(likes.gamemode_id IS NOT NULL, 1, 0) AS liked,
      IF(pins.gamemode_id IS NOT NULL, 1, 0) AS pinned,
      COALESCE(likes_count.likes_count, 0) AS likes_count,
      COALESCE(pins_count.pins_count, 0) AS pins_count
    FROM gamemodes
    LEFT JOIN likes ON likes.gamemode_id = gamemodes.id AND likes.user_id = ?
    LEFT JOIN pins ON pins.gamemode_id = gamemodes.id AND pins.user_id = ?
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
    ORDER BY pinned DESC, gamemodes.created_at ASC, gamemodes.id ASC`;

    const [gamemodes] = await connection.execute(query, [req.userId, req.userId]);
    req.gamemodes = gamemodes;
    next();
  }
  catch (error) {
    console.error(error);
    res.redirect('/error.html');
  }
  finally {
    if (connection) connection.release();
  }
}

const pinGamemode = async (req, res, next) => {
  try {
    const connection = await pool.getConnection();
    try {
      const gamemodeName = req.params.gamemodeName;
      const userId = req.userId;

      const checkGamemodeIdQuery = 'SELECT * FROM gamemodes WHERE name = ?';
      const [ resultGamemodes ] = await connection.execute(checkGamemodeIdQuery, [gamemodeName]);
      if (resultGamemodes.length !== 1) throw new Error();

      const gamemodeId = resultGamemodes[0].id;

      const checkDuplicateQuery = 'SELECT * FROM pins WHERE user_id = ? AND gamemode_id = ?';
      const [ duplicates ] = await connection.execute(checkDuplicateQuery, [userId, gamemodeId]);
      if (duplicates.length !== 0) {
        const removePinQuery = 'DELETE FROM pins WHERE user_id = ? AND gamemode_id = ?';
        await connection.execute(removePinQuery, [userId, gamemodeId]);
        next();
        return;
      }

      const insertQuery = 'INSERT INTO pins (user_id, gamemode_id) VALUES (?, ?)';
      await connection.execute(insertQuery, [userId, gamemodeId]);
      next();
    }
    catch (error) {
      console.log(error)
      res.status(500).redirect('/error.html');
    }
    finally {
      connection.release();
    }
  }
  catch (error) {
    console.log(error);
    res.status(500).redirect('/error.html');
  }
}

const likeGamemode = async (req, res, next) => {
  try {
    const connection = await pool.getConnection();
    try {
      const gamemodeName = req.params.gamemodeName;
      const userId = req.userId;

      const checkGamemodeIdQuery = 'SELECT * FROM gamemodes WHERE name = ?';
      const [ resultGamemodes ] = await connection.execute(checkGamemodeIdQuery, [gamemodeName]);
      if (resultGamemodes.length !== 1) throw new Error();

      const gamemodeId = resultGamemodes[0].id;

      const checkDuplicateQuery = 'SELECT * FROM likes WHERE user_id = ? AND gamemode_id = ?';
      const [ duplicates ] = await connection.execute(checkDuplicateQuery, [userId, gamemodeId]);
      if (duplicates.length !== 0) {
        const removeLikeQuery = 'DELETE FROM likes WHERE user_id = ? AND gamemode_id = ?';
        await connection.execute(removeLikeQuery, [userId, gamemodeId]);
        next();
        return;
      }

      const insertQuery = 'INSERT INTO likes (user_id, gamemode_id) VALUES (?, ?)';
      await connection.execute(insertQuery, [userId, gamemodeId]);
      next();
    }
    catch(error) {
      console.error(error);
      res.status(500).redirect('/error.html');

    }
    finally {
      connection.release();
    }
  }
  catch (error) {
    res.status(500).redirect('/error.html');
    res.redirect('error.html');
  }
}

// --- ROUTE HANDLERS ---

router.get('/:gamemodeName/play', checkLoggedIn, authenticate, checkGamemodeExistsByName, fetchLoggedInUserSettings, fetchDataOfGamemode, async (req, res) => {
  res.render('play', {gamemode: req.gamemodeData, settings: req.settings});
});

router.post('/:gamemodeName/play', checkLoggedIn, authenticate, validateNewScoreRequest, storeScoreInDatabase, (req, res) => {
  res.status(200).json(JSON.stringify({
    succes: 'succes'
  }))
});

router.get('/:gamemodeName', checkLoggedIn, authenticate, checkGamemodeExistsByName, fetchGlobalHighscoresOfGamemode, fetchDataOfGamemode, async (req, res) => {
  const gamemodeData = req.gamemodeData;
  res.render('gamemode', { gamemode: gamemodeData, highscores: req.globalHighscoresOfGamemode });
});

router.get('/', checkLoggedIn, authenticate, fetchDataOfAllGamemodes, (req, res) => {
  const gamemodes = req.gamemodes;
  res.render('select-gamemode', { gamemodes });
});

router.get('/:gamemodeName/pin', checkLoggedIn, authenticate, pinGamemode, async (req, res) => {
  res.redirect('/gamemodes');
})

router.get('/:gamemodeName/like', checkLoggedIn, authenticate, likeGamemode, async (req, res) => {
  res.redirect('/gamemodes');
})

module.exports = router;