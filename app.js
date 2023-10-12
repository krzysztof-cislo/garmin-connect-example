var express = require('express');
var session = require('express-session')
var cookieParser = require('cookie-parser');
var passport = require('passport');
var OAuth1Strategy = require('passport-oauth1');
const process = require("process");

const appUrl=  process.env.APP_HOST || 'http://localhost:8000';
const consumerKey = process.env.CONSUMER_KEY
const consumerSecret = process.env.CONSUMER_SECRET ;

const app = express();

app.use(cookieParser());
app.use(session({secret: 'secret', resave: false, saveUninitialized: false}))

app.get('/', (req, res) => {
    res.set('Content-Type', 'text/html');
    res.send('<a href="/auth">Connect GC Account</a>');
});

const garminStrategy = new OAuth1Strategy({
        requestTokenURL: 'https://connectapi.garmin.com/oauth-service/oauth/request_token',
        accessTokenURL: 'https://connectapi.garmin.com/oauth-service/oauth/access_token',
        userAuthorizationURL: 'https://connect.garmin.com/oauthConfirm',
        consumerKey,
        consumerSecret,
        signatureMethod: 'HMAC-SHA1',
        callbackURL: `${appUrl}/auth/callback`,
    },
    function (token, tokenSecret, profile, cb) {
        console.log(`Callback`, token, tokenSecret, profile);
        cb(null, {token, tokenSecret});
    }
);
garminStrategy.userAuthorizationParams = () => ({ oauth_callback: encodeURIComponent(`${appUrl}/auth/callback`) });

passport.serializeUser(function(user, done) { done(null, user); });
passport.deserializeUser(function(user, done) { done(null, user); });
passport.use(garminStrategy);

app.get('/auth', passport.authenticate('oauth'));

app.get('/auth/callback', passport.authenticate('oauth', { failureRedirect: '/auth/error' }), (req, res) => {
    res.send(`connected, user id: ${req.session.passport.user.token}`);
});

app.get('/auth/error', (req, res) => {
    res.send('not connected')
});

app.listen('8000');