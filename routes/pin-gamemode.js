const express = require('express');

const pool = require('../includes/database');
const { checkLoggedIn, authenticate } = require('../includes/authentication');

const router = express.Router();

router.get('/:gamemodeName/pin', checkLoggedIn, authenticate, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      if (!req.query.gamemode) return;
      const queryGamemodeId = req.query.gamemode;
      if (queryGamemodeId === '' || !Number.isInteger(Number(queryGamemodeId)) || Number(queryGamemodeId) > 1_000_000_000_000) return;
      const userId = req.userId;

      const checkGamemodeIdQuery = 'SELECT * FROM gamemodes WHERE id = ?';
      const [ resultGamemodes ] = await connection.execute(checkGamemodeIdQuery, [queryGamemodeId]);
      if (resultGamemodes.length !== 1) return;

      const checkDuplicateQuery = 'SELECT * FROM pins WHERE user_id = ? AND gamemode_id = ?';
      const [ duplicates ] = await connection.execute(checkDuplicateQuery, [userId, queryGamemodeId]);
      if (duplicates.length !== 0) {
        const removePinQuery = 'DELETE FROM pins WHERE user_id = ? AND gamemode_id = ?';
        await connection.execute(removePinQuery, [userId, queryGamemodeId]);
        return;
      }

      const insertQuery = 'INSERT INTO pins (user_id, gamemode_id) VALUES (?, ?)';
      await connection.execute(insertQuery, [userId, queryGamemodeId]);
    }
    catch {
      console.log(error)
    }
  }
  catch (error) {
    res.status(500).redirect('/error.html');
  }
  finally {
    res.redirect('/select-gamemode');
    connection.release();
  }
})

module.exports = router;