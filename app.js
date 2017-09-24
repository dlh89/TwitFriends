var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var ejs = require('ejs');
var Twit = require('twit');

var config = require(path.join(__dirname, '/public/js/config'));
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
    // asynchronous api call
    T.get('friends/ids', { screen_name: playerHandle }, function (err, data) {
        var friends = data.ids;
        cbFollowers(friends)
    });

    // callback function executed once friends are retrieved
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
            console.log("Mutual followers: " + mutualFollowerCount);
            console.log(mutualFollowers);
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
                    console.log(data[0].screen_name)
                } else {
                    questionLength--
                }

                // check if forEach has finished
                if(friendNames.length == questionLength){
                    console.log(friendNames);
                    cbGenerateAnswers(friendNames)
                }
            });

        });
    }

    function cbGenerateAnswers(friendNames){
        // generate random number in range friendNames length
        // answers[1] = name etc
        // assign that name as answer to question
        var possibleAnswers = friendNames.slice();  // make a copy the friendNames array
        var answers = {};
        var questionNum = 1;

        friendNames.forEach(function(){
            var randomNum = Math.floor((Math.random() * possibleAnswers.length));
            answers[questionNum] = possibleAnswers[randomNum];  // add random friend to answers object with question num
            possibleAnswers.splice(randomNum, 1);  // remove 1 item at the index of randomNum
            questionNum++;
        });

        console.log(answers)

        res.render('quiz', {friend_names: friendNames, answers: answers});
    }
});

app.get("/friends", function(req, res, next){
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
            console.log("Mutual followers: " + mutualFollowerCount);
            console.log(mutualFollowers);
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
                    console.log(data[0].screen_name)
                } else {
                    questionLength--
                }

                // check if forEach has finished
                if(friendNames.length == questionLength){
                    console.log(friendNames);
                    res.send(friendNames)
                }
            });

        });
    }
});

app.get("/question", function(req, res, next){
    var params = {
        screen_name: req.query.id,  // handle GET parameter
        count: 9999,
        include_rts: false
    };
    // make twitter api call to get text from most recent status for user
    T.get('statuses/user_timeline',params, function(err, data) {
        tweetLength = data.length;
        var tweets = data[tweetLength-1].text;
        console.log(data);
        res.send(tweets)
    });
});

app.listen(port, function(){
    console.log('Server started on port ' + port + '...');
});