var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var ejs = require('ejs');
var Twit = require('twit');

var config = require(path.join(__dirname, 'config'));
var T = new Twit(config);

var port = 3000;

var app = express();

// view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


//middleware
// body-parser middleware (handle parsing json)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// set static path
app.use(express.static(path.join(__dirname, 'public')));

// bootstrap middleware
app.use('/bs', express.static(__dirname + '/node_modules/bootstrap/')); // redirect bootstrap JS

// redirect /scripts to node_modules folder
app.use('/scripts', express.static(__dirname + '/node_modules/'));

// global vars
app.use(function(req, res, next){
    res.locals.player_handle = null;
    next();
})

// error handling
app.use(function (err, req, res, next) {
    //console.error(err.stack)
    //res.status(500).send('Something broke!')
    console.log(err)
});


// routes
app.get('/', function(req, res, next){
    res.render('index');
});

app.get('/quiz', function(req, res, next) {
    var playerHandle = req.query.playerHandle;
    res.render('quiz', {player_handle: playerHandle});
});

app.get('/about', function(req, res, next) {
    res.render('about');
});

app.get('/contact', function(req, res, next) {
    res.render('contact');
});

app.get('/friends', function(req, res, next){
    var params = {
        screen_name: req.query.playerHandle,
        count: 200
    };

    var friends = [];
    var mutuals = [];

    // self invoking function
    (function() {
        T.get('friends/list', params, function (err, data, response) {
            if (data.errors) {
                console.log(data.errors[0].message);
                return res.send(data.errors)
            } else {
                data.users.forEach(function (user) {
                    friends.push(user.screen_name)
                })
            }
            // call getFollowers after finding friends
            getFollowers()
        });
    })();

    function getFollowers(){
        T.get('followers/list',params, function(err, data, response) {
            if(data.errors){
                console.log(data.errors[0].message);
                res.send(data.errors)
            } else {
                data.users.forEach(function(user){
                    // if followers are also friends, their profile isn't protected and they've made tweets then add to mutuals
                    if(friends.includes(user.screen_name) && user.protected == false && user.statuses_count != 0){
                        mutuals.push(user.screen_name)
                    }
                })
            }
            res.send(mutuals)
        });
    }
});

app.get('/question', function(req, res, next){
    var params = {
        id: req.query.id,  // handle GET parameter
        count: 999,
        include_rts: false,
        tweet_mode: "extended"
    };
    // make twitter api call to get text from most recent status for user
    T.get('statuses/user_timeline', params, function(err, data) {
        var tweetsLength = data.length;
        // choose a random tweet
        var randomTweet = Math.floor(Math.random() * tweetsLength);
        var tweets = data[randomTweet];
        res.send(tweets)
    });
});
/*
app.get('/profile', function(req, res, next){
    var params = {
        user_id: req.query.id  // handle GET parameter
    };
    // make twitter api call to get text from most recent status for user
    T.get('users/lookup', params, function(err, data) {
        var screen_name = data[0].screen_name;
        res.send(screen_name)
    });
});
 */
app.listen(port, function(){
    console.log('Server started on port ' + port + '...');
});
