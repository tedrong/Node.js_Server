// config/passport.js

var LocalStrategy		= require('passport-local').Strategy;
var FacebookStrategy	= require('passport-facebook').Strategy;
var TwitterStrategy		= require('passport-twitter').Strategy;
var User				= require('../app/models/user');
var configAuth			= require('./auth');

// Expose this function to our app using module.exports.
module.exports = function(passport) {

	// Passport session setup ----------------------------------------------------
	// Used to serialize the user for the session.
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	// Used to deserialize the user.
	passport.deserializeUser(function(id, done) {
		User.findById(id, function(err, user) {
			done(err, user);
		});
	});

	// LOCAL SIGNUP --------------------------------------------------------------
	passport.use('local-signup', new LocalStrategy({
		// By default, local strategy uses username and password, we will override with email.
		usernameField : 'email',
		passwordField : 'password',
		// Allows us to pass back the entire request to the callback.
		passReqToCallback : true
	},
	function(req, email, password, done) {

		// Asynchronous
		// User.findOne start, when data is sent back.
		process.nextTick(function() {

			// Find datbase match.
			User.findOne({ 'local.email' :  email }, function(err, user) {
				// Return the error.
				if (err)
					return done(err);

				// If theres already a user with that email.
				if (user) {
					return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
				}//if
				else {
					// If there is no user with that email, create the user.
					var newUser = new User();
					newUser.local.email    = email;
					newUser.local.password = newUser.generateHash(password);

					// Save the user.
					newUser.save(function(err) {
						if (err)
							throw err;
						return done(null, newUser);
					});
				}//else
			});//findOne
        });//nextTick
    }));//Local SignUp

	// LOCAL LOGIN ---------------------------------------------------------------
	passport.use('local-login', new LocalStrategy({
		// By default, local strategy uses username and password, we will override with email.
		usernameField : 'email',
		passwordField : 'password',
		// Allows us to pass back the entire request to the callback.
		passReqToCallback : true
	},
		function(req, email, password, done) { 
			// Find datbase match.
			User.findOne({ 'local.email' :  email }, function(err, user) {
				// Return the error.
				if (err)
					return done(err);

				// If not found, return the message.
				if (!user)
					return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

				// User is found, password is wrong.
				if (!user.validPassword(password))
					return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // Create the loginMessage and save it to session as flashdata

				// All well, return successful.
				return done(null, user);
			});//findOne
		}//function
	));//Local LogIn
	
	// FACEBOOK ------------------------------------------------------------------
	passport.use(new FacebookStrategy({
		// Pull in our app id and secret from our auth.js file.
			clientID		: configAuth.facebookAuth.clientID,
			clientSecret	: configAuth.facebookAuth.clientSecret,
			callbackURL		: configAuth.facebookAuth.callbackURL,
			profileFields: ['id', 'emails', 'displayName', 'name', 'gender'],
			// Allows us to pass in the req from our route (lets us check if a user is logged in or not)	
			passReqToCallback : true
		},
		
		// Facebook will send back the token and profile.
		function(req, accesstoken, refreshToken, profile, done){
			console.log('In passport.js : Start FacebookStrategy\n');
			console.log(profile);
			
			//Asynchronous
			process.nextTick(function(){
				// Check if user is already logged in
				if(!req.user){
					// Find user in the database by their facebook id
					console.log('In passport.js : facebook nextTick-asynchronous function\n');
					User.findOne({'facebook.id' : profile.id}, function(err, user){
						console.log('In passport.js : facebook Database FindOne method\n');

						// Connecting to database.
						if(err)
							return done(err);
						if(user){
							// if there is a user id already but no token (user was linked at one point and then removed)
                        // just add our token and profile information
                        if (!user.facebook.token) {
                            user.facebook.token = token;
                            user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                            user.facebook.email = profile.emails[0].value;

                            user.save(function(err) {
                                if (err)
                                    throw err;
                                return done(null, user);
                            });
                        }
							
							// User found, return that user.
							return done(null, user);
						}
						else{
							// If no user found with that facebook id, create them.
							console.log('In passport.js : facebook User do not match in database id\nCreate user...\n');
							var newUser = new User();

							// Set all of the facebook information in our user model
							newUser.facebook.id		= profile.id;												// Set the users facebook id.
							newUser.facebook.token	= accesstoken;												// The token that facebook provides to user.
							newUser.facebook.name	= profile.name.givenName + ' ' + profile.name.familyName;
							newUser.facebook.email	= profile.emails[0].value;									// Facebook can return multiple emails so we'll take the first.
							newUser.facebook.gender	= profile.gender;

							console.log('In passport.js : Creating :\n');
							console.log('Id		= ' + profile.id + '\n' +
										'Token	= ' + accesstoken + '\n' +
										'Name	= ' + profile.name.givenName + ' ' + profile.name.familyName + '\n' +
										'Email	= ' + profile.emails[0].value + '\n' +
										'Gender	= ' + profile.gender + '\n'
										);

							// Save our to the database.
							newUser.save(function(err){
								if(err)
									throw err;
								// If successed, return the new user
								return done(null, newUser);
							});//save newUser
						}//else
					});//findOne
				}//if_!req.user
				else{
					// User already exists and is logged in, we have to link accounts.
					// Pull the user out of the session
					var user = req.user;
					
					// Update the current users facebook credentials
					user.facebook.id		= profile.id;												// Set the users facebook id.
					user.facebook.token	= accesstoken;												// The token that facebook provides to user.
					user.facebook.name	= profile.name.givenName + ' ' + profile.name.familyName;
					user.facebook.email	= profile.emails[0].value;									// Facebook can return multiple emails so we'll take the first.
					user.facebook.gender	= profile.gender;
					
					// Save to database
					user.save(function(err){
						if(err)
							throw err;
						return done(null, user);
					});//save
				}//else
			});//nextTick
		})); //facebookstrategy
};//module.exports