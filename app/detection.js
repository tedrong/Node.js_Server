// app/detection.js

var User		= require('../app/models/user');
var jsdom		= require('jsdom');
var request		= require('request');
var sparkConfig	= require('../config/spark');
var redis		= require('redis'),client = redis.createClient();
var dateFormat	= require('dateformat');

module.exports = function(app) {
	
	//	HOME PAGE -----------------------------------------------------------------
	app.get('/detection', isLoggedIn, function(req, res) {
		
		client.on("error", function(err){
			console.log("Redis connect error: " + err);
		});
		
		//	load index.ejs file
		res.render('detection.ejs', {
			// Get the user out of session(cookies) and pass to template.
			user : req.user
		});
	});
	
	app.get('/detection/submit', isLoggedIn, function(req, res){
		console.log(req.user.local);
		console.log(req.user.facebook);

		// Set the headers
		var headers = {
			'User-Agent':       'Super Agent/0.0.1',
			'Content-Type':     'application/x-www-form-urlencoded'
		}

		// Configure the request
		var options = {
			url: "http://" + "i7-dorm" + ":6066" + "/v1/submissions/create",
			method: 'POST',
			headers: "Content-Type:application/json;charset=UTF-8",
			json: {
				  "action" : "CreateSubmissionRequest",
				  "appArgs" : [ "myAppArgument1" ],
				  "appResource" : "file:/myfilepath/spark-job-1.0.jar",
				  "clientSparkVersion" : "1.5.0",
				  "environmentVariables" : {
					"SPARK_ENV_LOADED" : "1"
				  },
				  "mainClass" : "com.mycompany.MyJob",
				  "sparkProperties" : {
					"spark.jars" : "file:/myfilepath/spark-job-1.0.jar",
					"spark.driver.supervise" : "false",
					"spark.app.name" : "MyJob",
					"spark.eventLog.enabled": "true",
					"spark.submit.deployMode" : "cluster",
					"spark.master" : "spark://spark-cluster-ip:6066"
				  }
			}
		}

		// Start the request
		request(options, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				// Print out the response body
				console.log(body)
				//console.log(body.submissionId)
				
				var now = new Date();
				var stamp = dateFormat(now, "yyyy-mmmm-dd/h:MM:ss");
				//console.log(stamp);
				client.hset(req.user.local.email, stamp, body.submissionId);
				
			}
		})
		
		res.render('detection.ejs', {
			// Get the user out of session(cookies) and pass to template.
			user : req.user
		});
		
	});
	
	app.get('/detection/jobs', isLoggedIn, function(req, res) {
		client.hgetall(req.user.local.email, function (err, reply) {
			res.render('jobs_management.ejs', {
				// Get the reply out of session(cookies) and pass to template.
				jobs : reply
			});//render

			if(err){
				console.log(err); // => 'The connection has already been closed.'
			}
		});//hgetall	
	});
	
	
	app.post('/detection/job/detail', isLoggedIn, function(req, res){
		//console.log(req);
		console.log(req.body.info);
		var time = req.body.info.substring(0, 19);
		var jobid = req.body.info.replace(time, "");
		
		// Set the headers
		var headers = {
			'User-Agent':       'Super Agent/0.0.1',
			'Content-Type':     'application/x-www-form-urlencoded'
		}

		// Configure the request
		var options = {
			url: "http://" + "i7-dorm" + ":6066" + "/v1/submissions/kill/" + jobid,
			method: 'POST',
			headers: "Content-Type:application/json;charset=UTF-8",
		}

		// Start the request
		request(options, function (error, response, body) {
			// Print out the response body
			//console.log(body.driverState)
			
			res.render('job_detail.ejs', {
				message : body
			});
		})
		client.hdel(req.user.local.email, time);
	});
	
}

// Route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
	// If user is authenticated in the session, carry on 
	if (req.isAuthenticated())
		return next();
	// If they aren't redirect them to the home page
	res.redirect('/');
}//isLoggedIn
