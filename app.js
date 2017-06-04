// This is the porject entry point.

// Setting up ----------------------------------------------------------------------
// Get all tools that we need.
var express			= require('express');
var app				= express();
var path			= require('path');
var flash			= require('connect-flash');
var cookieParser	= require('cookie-parser');
var bodyParser		= require('body-parser');
var favicon			= require('serve-favicon');
var logger			= require('morgan');
var session			= require('express-session');
var mongoose		= require('mongoose');
var configDB		= require('./config/database.js');
var passport		= require('passport');

// Configuration ---------------------------------------------------------------

// Connecting to database.
mongoose.connect(configDB.url);

// Pass passport.
require('./config/passport')(passport);

// Setup view engine ('ejs', 'jade').
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public.
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Required for passport.
app.use(session({
			secret: 'ndhuwiselabiotplatformtedrong',
			resave: true,
			saveUninitialized: true
		}));
app.use(passport.initialize());

// Persistent login sessions.
app.use(passport.session());

// Use connect-flash for flash messages stored in session (cookies).
app.use(flash());

//routes ----------------------------------------------------------------------
require('./app/index.js')(app, passport);
require('./app/detection.js')(app);

module.exports = app;