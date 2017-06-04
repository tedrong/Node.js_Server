// app/index.js

var User = require('../app/models/user');

module.exports = function(app, passport) {

	//	PREVENT favicon.ico 404 ---------------------------------------------------
	app.get('/favicon.ico', function(req, res){
		res.sendStatus(204);
	});
	
	//	HOME PAGE -----------------------------------------------------------------
	app.get('/', function(req, res) {
		//	load index.ejs file
		res.render('index.ejs');
	});

	// LOGIN PAGE ----------------------------------------------------------------
	app.get('/login', function(req, res) {
		// Render the page and pass in any flash data if it exists
		res.render('login.ejs', { message: req.flash('loginMessage') }); 
	});

	// PROCESS LOGIN REQUEST -----------------------------------------------------
	app.post('/login', passport.authenticate('local-login', {
		// If login success, redirect to /profile page.
		successRedirect : '/profile',
		// If login fail, redirect to /login page.
		failureRedirect : '/login',
		// Allow flash messages.
		failureFlash : true
	}));

	// SIGNUP PAGE ---------------------------------------------------------------
	app.get('/signup', function(req, res) {
		// Render the page and pass in any flash data if it exists
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	// PROCESS SIGNUP REQUEST ---------------------------------------------------
	app.post('/signup', passport.authenticate('local-signup', {
		// If signup success, redirect to /profile page.
		successRedirect : '/profile',
		// If signup fail, redirect to /login page.
		failureRedirect : '/signup',
		// Allow flash messages.
		failureFlash : true
	}));

	// PROFILE PAAGE -------------------------------------------------------------
	// This page is protected, you need to login to visit. (use middleware function 'isLoggedIn' to verify)
	app.get('/profile', isLoggedIn, function(req, res) {
		res.render('profile.ejs', {
			// Get the user out of session(cookies) and pass to template.
			user : req.user
		});
	});
	
	// FACEBOOK ROUTES -----------------------------------------------------------
	// For Facebook authentication and login.
	app.get('/auth/facebook', passport.authenticate('facebook', {
		authType: 'rerequest',
		scope: ['email','read_custom_friendlists','publish_actions','user_managed_groups'],
		display:"page" }));
	
	// Handle the callback after facebook has authenticated the user.
	app.get('/auth/facebook/callback',
			passport.authenticate('facebook',{
				successRedirect : '/profile',
				failureRedirect : '/'
	}));
	
	// AUTHORIZE (LOGGED IN, CONNECTING WITH SOCIAL ACCOUNT)-Head ----------------
	// Local ---------------------------------------------------------------------
	app.get('/connect/local', function(req, res){
		res.render('connect-local.ejs', {message: req.flash('loginMessage')});
	});
	
	app.post('/connect/local', passport.authenticate('local-signup', {
		successRedirect : '/profile',
		failureRedirect : '/connect/local',
		failureFlash : true
	}));
	
	// Facebook -------------------------------
	// Send to facebook to do the authentication
	app.get('/connect/facebook', passport.authorize('facebook', { scope : 'email' }));
	
	// Handle the callback after facebook has authorized the user
	app.get('/connect/facebook/callback',
		passport.authorize('facebook', {
		successRedirect : '/profile',
		failureRedirect : '/'
	}));
	// AUTHORIZE (LOGGED IN, CONNECTING WITH SOCIAL ACCOUNT)-End -----------------
	
	
	// UNLINK ACCOUNTS 
	// Used to unlink accounts. for social accounts, just remove the token.
	// For local account, remove email and password.
	// User account will stay active in case they want to reconnect in the future.

	// Local ---------------------------------------------------------------------
	app.get('/unlink/local', function(req, res) {
		var user = req.user;
		user.local.email    = undefined;
		user.local.password = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});
	// Facebook ------------------------------------------------------------------
	app.get('/unlink/facebook', function(req, res) {
		var user = req.user;
		user.facebook.token = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});
	
	// App Token -----------------------------------------------------------------
	app.post('/apptoken', function(req, res){
		console.log(req.body)
		User.update({'local.email': req.body.user}, {'$set': {'local.apptoken': req.body.token}},
					function(err, raw){
						if(err){
							console.log('Error log: ' + err);
						}
						else{
							console.log('Token updated: ' + raw);
						}
					}
		);
		res.redirect('/');
	});
	
	// LOGOUT --------------------------------------------------------------------
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});
};//module exports

// Route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
	// If user is authenticated in the session, carry on 
	if (req.isAuthenticated())
		return next();
	// If they aren't redirect them to the home page
	res.redirect('/');
}//isLoggedIn