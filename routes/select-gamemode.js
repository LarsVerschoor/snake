const express = require('express');

const pool = require('../includes/database');
const { checkLoggedIn, authenticate } = require('../includes/authentication');

const router = express.Router();

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