const pool = require('./database');

// redirect if not logged in
const checkLoggedIn = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
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
    res.redirect('/login');
  }
  finally {
    connection.release();
  }
}

// redirect if logged in
const checkNotLoggedIn = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
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
    res.redirect('/');
  }
  finally {
    connection.release();
  }
}

// retrieve user-id from database
const authenticate = async (req, res, next) => {
  const connection = await pool.getConnection();
  
  try {
    const cookie = req.cookies['session_authentication'];
    const getUserQuery = 'SELECT users.id FROM sessions LEFT JOIN users ON sessions.user_id = users.id WHERE sessions.authentication_cookie = ?';
    const [users] = await connection.execute(getUserQuery, [cookie]);
    req.userId = users[0].id;
    next();
  }
  catch (error) {
    console.error(error);
    res.send('An unexpected error occured on the server.');
  }
  finally {
    connection.release();
  }
}

module.exports = { checkLoggedIn, checkNotLoggedIn, authenticate }