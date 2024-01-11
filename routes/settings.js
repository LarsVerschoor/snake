const express = require('express');
const router = express.Router();
const pool = require('../includes/database')
const { checkLoggedIn, authenticate } = require('../includes/authentication');

const getSettings = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
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
    // redirect to error page
    console.error(error);
  }
  finally {
    connection.release();
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
  const connection = await pool.getConnection();
  const errors = new Array();

  try {
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
    connection.release();
  }
}

router.get('/', checkLoggedIn, authenticate, getSettings, (req, res) => {
  res.render('settings', { settings: req.settings, errors: {} });
})

router.post('/', checkLoggedIn, authenticate, validateInput, saveSettings, (req, res) => {
  res.send('<a href="">Return to settings</a><br>Feature still under development')
})

module.exports = router;