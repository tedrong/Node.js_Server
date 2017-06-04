// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        'clientID'      : '1281511828629644', //your App ID		: 'your-secret-clientID-here'
        'clientSecret'  : '9b84f314714caac23377008e95fb62b5', //your App Secret		: 'your-client-secret-here'
        'callbackURL'   : 'http://localhost:3000/auth/facebook/callback'
    },

    'twitterAuth' : {
        'consumerKey'       : '', //'your-consumer-key-here'
        'consumerSecret'    : '	', //'your-client-secret-here'
        'callbackURL'       : 'http://localhost:3000/auth/twitter/callback'
    },

    'googleAuth' : {
        'clientID'      : 'your-secret-clientID-here', //'your-secret-clientID-here'
        'clientSecret'  : 'your-client-secret-here', //'your-client-secret-here'
        'callbackURL'   : 'http://localhost:8080/auth/google/callback'
    }

};