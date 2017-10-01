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

app.get('/friends', function(req, res, next){
    var playerHandle = req.query.playerHandle;
    // Twit api call to get friends
    T.get('friends/ids', { screen_name: playerHandle }, function (err, data) {
        var friends = data.ids;
        cbFollowers(friends)
    });

    // callback function executed once friends are retrieved to get followers and see which are also friends
    function cbFollowers(friends){
        T.get('followers/ids', { screen_name: playerHandle }, function (err, data) {
            var followers = data.ids;
            var mutualFollowers = [];

            var mutualFollowerCount = 0;
            followers.forEach(function(follower){
                if(friends.includes(follower)){
                    mutualFollowerCount ++;
                    mutualFollowers.push(follower)
                }
            });
            cbGetNames(mutualFollowers)
        })
    }

    // go through list of mutual followers and lookup their name from twitter, adding it to friendNames list
    function cbGetNames(mutualFollowers) {
        var questionLength = mutualFollowers.length;
        console.log(questionLength);
        var friendNames = [];
        mutualFollowers.forEach(function(mutual){
            var params = {
                user_id: mutual,
                include_entities: false
            };
            T.get('users/lookup', params, function (err, data) {
                // if the user lookup returns no data then this friend cannot be used so decrement the questionsLength
                if(data[0]){
                    friendNames.push(data[0].screen_name);
                } else {
                    questionLength--
                }

                // check if forEach has finished
                if(friendNames.length == questionLength){
                    friendNames.sort();
                    res.send(friendNames)
                }
            });

        });
    }
});

app.get('/question', function(req, res, next){
    var params = {
        screen_name: req.query.id,  // handle GET parameter
        count: 999,
        include_rts: false
    };
    // make twitter api call to get text from most recent status for user
    T.get('statuses/user_timeline',params, function(err, data) {
        var tweetsLength = data.length;
        // choose a random tweet
        var randomTweet = Math.floor(Math.random() * tweetsLength);
        var tweets = data[randomTweet].text;
        res.send(tweets)
    });
});

app.get('/results', function(req, res, next){
    res.render('results')
});

app.listen(port, function(){
    console.log('Server started on port ' + port + '...');
});