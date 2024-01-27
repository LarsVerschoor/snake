const http = require('http' )
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const sessionsCleanup = require('./includes/sessions_cleanup');
const path = require('path');

const app = express();
const server = http.createServer(app);

app.set('view engine', 'ejs');

// bodyparser for form post data
app.use(bodyParser.urlencoded({
  extended: false
}));

// bodyparser for JSON post data
app.use(bodyParser.json())

app.use(cookieParser());

app.use(express.static('public'));

// routing
const indexRoute = require('./routes/index');
const registerRoute = require('./routes/register');
const loginRoute = require('./routes/login');
const logoutRoute = require('./routes/logout');
const gamemodesRoute = require('./routes/gamemodes');
const myStatisticsRoute = require('./routes/my-statistics');
const playersRoute = require('./routes/players');
const settingsRoute = require('./routes/settings');
const resetSettingsRoute = require('./routes/settings-reset');
const deathRoute = require('./routes/death');

app.use('/', indexRoute);
app.use('/register', registerRoute);
app.use('/login', loginRoute);
app.use('/logout', logoutRoute);
app.use('/gamemodes', gamemodesRoute);
app.use('/my-statistics', myStatisticsRoute);
app.use('/players', playersRoute);
app.use('/settings', settingsRoute);
app.use('/settings-reset', resetSettingsRoute);
app.use('/death', deathRoute);

app.get('/*', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, '/public', '404.html'));
})

sessionsCleanup.initialize();

server.listen(2001);