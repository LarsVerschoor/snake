const express = require('express');
const router = express.Router();
const pool = require('../includes/database')
const { checkLoggedIn, authenticate } = require('../includes/authentication');

const getSettings = async (req, res, next) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const query = 'SELECT * FROM settings WHERE user_id = ?'
    const [ settings ] = await connection.execute(query, [ req.userId ]);
    if (settings.length !== 1) {
      res.redirect('/');
      return;
    }
    req.settings = settings[0];
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

const validateInput = (req, res, next) => {
  const errors = new Array();

  // Regular expression to validate hex colors
  const hexColorRegex = new RegExp(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/);

  const {
    color_snake_head,
    color_snake_body,
    color_food,
    color_obstacles
  } = req.body;

  if (!hexColorRegex.test(color_snake_head)) errors['color_snake_head'] = 'This field only accepts colors in HEX format (#rrggbb or #rgb)';
  if (!hexColorRegex.test(color_snake_body)) errors['color_snake_body'] = 'This field only accepts colors in HEX format (#rrggbb or #rgb)';
  if (!hexColorRegex.test(color_food)) errors['color_food'] = 'This field only accepts colors in HEX format (#rrggbb or #rgb)';
  if (!hexColorRegex.test(color_obstacles)) errors['color_obstacles'] = 'This field only accepts colors in HEX format (#rrggbb or #rgb)';

  if (color_snake_head === '') errors['color_snake_head'] = 'This field cannot be empty';
  if (color_snake_body === '') errors['color_snake_body'] = 'This field cannot be empty';
  if (color_food === '') errors['color_food'] = 'This field cannot be empty';
  if (color_obstacles === '') errors['color_obstacles'] = 'This field cannot be empty';

  if (errors.length === 0) {
    next();
    return;
  }

  res.render('settings', { settings: req.body, errors: errors });
}

const saveSettings = async (req, res, next) => {
  const errors = new Array();
  let connection;

  try {
    connection = await pool.getConnection();
    const {
      color_snake_head,
      color_snake_body,
      color_food,
      color_obstacles
    } = req.body;

    const query = `
    UPDATE settings SET
      color_snake_head = ?,
      color_snake_body = ?,
      color_food = ?,
      color_obstacles = ?
    WHERE user_id = ?`;

    await connection.execute(query, [
      color_snake_head,
      color_snake_body,
      color_food,
      color_obstacles,
      req.userId
    ])

    next();
  }
  catch (error) {
    errors['general'] = 'An unexpected error occured while saving your settings. Please try again later.';
    res.render('settings', { settings: req.body, errors: errors });
  }
  finally {
    if (connection) connection.release();
  }
}

router.get('/', checkLoggedIn, authenticate, getSettings, (req, res) => {
  res.render('settings', { settings: req.settings, errors: {} });
})

router.get('/*', (req, res) => {
  res.redirect('/404.html')
})

router.post('/', checkLoggedIn, authenticate, validateInput, saveSettings, getSettings, (req, res) => {
  res.render('settings', { settings: req.settings, errors: {} });
})

module.exports = router;