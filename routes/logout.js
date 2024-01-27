const express = require('express');

const pool = require('../includes/database');
const { checkLoggedIn, authenticate } = require('../includes/authentication');

const router = express.Router();

const logout = async (req, res, next) => {
  let connection;

  try {
    connection = await pool.getConnection();
    const userId = req.userId;

    await connection.execute('DELETE FROM sessions WHERE user_id = ?', [userId]);
    res.clearCookie('session_authentication');
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

router.get('/', checkLoggedIn, authenticate, logout, (req, res) => {
  res.redirect('/login');
})

module.exports = router;