const express = require('express');

const pool = require('../includes/database');
const { checkLoggedIn, authenticate } = require('../includes/authentication');

const router = express.Router();

router.get('/', checkLoggedIn, authenticate, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    if (!req.query.gamemode) return;
    const queryGamemodeId = req.query.gamemode;
    if (queryGamemodeId === '' || !Number.isInteger(Number(queryGamemodeId)) || Number(queryGamemodeId) > 1_000_000_000_000) return;
    const userId = req.userId;

    const checkGamemodeIdQuery = 'SELECT * FROM gamemodes WHERE id = ?';
    const [ resultGamemodes ] = await connection.execute(checkGamemodeIdQuery, [queryGamemodeId]);
    if (resultGamemodes.length !== 1) return;

    const checkDuplicateQuery = 'SELECT * FROM likes WHERE user_id = ? AND gamemode_id = ?';
    const [ duplicates ] = await connection.execute(checkDuplicateQuery, [userId, queryGamemodeId]);
    if (duplicates.length !== 0) {
      const removeLikeQuery = 'DELETE FROM likes WHERE user_id = ? AND gamemode_id = ?';
      await connection.execute(removeLikeQuery, [userId, queryGamemodeId]);
      return;
    }

    const insertQuery = 'INSERT INTO likes (user_id, gamemode_id) VALUES (?, ?)';
    await connection.execute(insertQuery, [userId, queryGamemodeId]);
  }
  catch(error) {
    console.error(error);
  }
  finally {
    res.redirect('/select-gamemode');
    connection.release();
  }
})

module.exports = router;