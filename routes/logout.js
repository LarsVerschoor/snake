const express = require('express');

const pool = require('../includes/database');
const { checkLoggedIn, authenticate } = require('../includes/authentication');

const router = express.Router();

const logout = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    const userId = req.userId;

    await connection.execute('DELETE FROM sessions WHERE user_id = ?', [userId]);
    res.clearCookie('session_authentication');
    next();
  }
  catch (error) {
    res.redirect('/');
    console.error(error);
  }
  finally {
    connection.release();
  }
}

router.get('/', checkLoggedIn, authenticate, logout, (req, res) => {
  res.redirect('/login');
})

module.exports = router;