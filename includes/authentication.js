const pool = require('./database');

// redirect if not logged in
const checkLoggedIn = async (req, res, next) => {
  let connection;
  try {
    connection = await pool.getConnection();
    if (!req.cookies['session_authentication']) {
      res.redirect('/login');
      return;
    }

    const cookie = req.cookies['session_authentication'];
    const [sessions] = await connection.execute('SELECT * FROM sessions WHERE authentication_cookie = ?', [cookie]);
    
    if (sessions.length === 0) {
      res.redirect('/login');
      return;
    }

    next();
  }
  catch (error) {
    console.error(error)
    res.redirect('/error.html');
  }
  finally {
    if (connection) connection.release();
  }
}

// redirect if logged in
const checkNotLoggedIn = async (req, res, next) => {
  let connection;
  try {
    connection = await pool.getConnection();
    if (!req.cookies['session_authentication']) {
      next();
      return;
    }

    const cookie = req.cookies['session_authentication'];
    const [sessions] = await connection.execute('SELECT * FROM sessions WHERE authentication_cookie = ?', [cookie]);

    if (sessions.length === 0) {
      next();
      return;
    }

    res.redirect('/');
  }
  catch (error) {
    console.error(error)
    res.redirect('/error.html');
  }
  finally {
    if (connection) connection.release();
  }
}

// retrieve user-id from database
const authenticate = async (req, res, next) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const cookie = req.cookies['session_authentication'];
    const getUserQuery = 'SELECT users.id FROM sessions LEFT JOIN users ON sessions.user_id = users.id WHERE sessions.authentication_cookie = ?';
    const [users] = await connection.execute(getUserQuery, [cookie]);
    req.userId = users[0].id;
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

module.exports = { checkLoggedIn, checkNotLoggedIn, authenticate }