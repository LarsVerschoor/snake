const http = require('http' )
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const sessionsCleanup = require('./includes/sessions_cleanup');

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
const selectGamemodeRoute = require('./routes/select-gamemode');
const likeGamemodeRoute = require('./routes/like-gamemode');
const pinGamemodeRoute = require('./routes/pin-gamemode');
const myStatisticsRoute = require('./routes/my-statistics');
const playersRoute = require('./routes/players');
const settingsRoute = require('./routes/settings');
const playRoute = require('./routes/play');
const deathRoute = require('./routes/death');

app.use('/', indexRoute);
app.use('/register', registerRoute);
app.use('/login', loginRoute);
app.use('/logout', logoutRoute);
app.use('/select-gamemode', selectGamemodeRoute);
app.use('/like-gamemode', likeGamemodeRoute);
app.use('/pin-gamemode', pinGamemodeRoute);
app.use('/my-statistics', myStatisticsRoute);
app.use('/players', playersRoute);
app.use('/settings', settingsRoute);
app.use('/play', playRoute);
app.use('/death', deathRoute);

sessionsCleanup.initialize();

server.listen(2001);