const express = require('express');

const { checkLoggedIn, authenticate } = require('../includes/authentication');
const pool = require('../includes/database');

const router = express.Router();

const resetSettings = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const query = `
    UPDATE settings SET
      color_snake_head = default,
      color_snake_body = default,
      color_food = default,
      color_obstacles = default
    WHERE user_id = ?`;

    await connection.execute(query, [ req.userId ]);

    next();
  }
  catch(error) {
    // TODO: redirect to error page
    console.error(error);
  }
  finally {
    connection.release();
  }
}

router.get('/', checkLoggedIn, authenticate, resetSettings, (req, res) => {
  res.redirect('settings');
})

module.exports = router;