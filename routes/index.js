var express = require('express');
var router = express.Router();
var request = require('request');

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', { title: 'World Games Server' });
});

router.get('/api/flags', function (req, res) {
    console.log("Getting flags...");
    res.json([{ "id": 1, "name": "Koen" },
                { "id": 2, "name": "Stéphanie" },
                { "id": 3, "name": "Febe" },
                { "id": 4, "name": "Randy" }
    ]);
});

var MongoClient = require('mongodb').MongoClient;

router.get('/getAllPlaces', function (req, res) {
    console.log("getAllPlaces GET");
    MongoClient.connect("mongodb://ds055690.mongolab.com:55690/buytheworld", function (err, db) {
        if (err) {
            console.log("ERROR connecting to MongoDB: " + err);
            res.json([{ "Code": "ERROR_CONNECTING" }]);
        }
        else {
            console.log("Connected to MongoDB");
            //Authenticate after connecting
            db.authenticate('cognito_btw', 'G6rzc4dlr', function (authErr, success) {
                if (authErr) {
                    console.log("ERROR authenticating to MongoDB: " + err);
                    res.json([{ "Code": "ERROR_AUTHENTICATING" }]);
                }
                else {
                    console.log("Authenticated to MongoDB");
                    db.collection("place").find().toArray(function (err, places) {
                        if (err) {
                            console.log("ERROR retrieving data: " + err);
                            res.json([{ "Code": "ERROR_RETRIEVING" }]);
                        }
                        else {
                            console.log("retrieved records:");
                            console.log(places);
                            res.json(places)
                        }
                    });
                }
            });
        }
    });
});

router.post('/setPlace', function (req, res) {
    console.log("setPlace POST");
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    // The above 2 lines are required for Cross Domain Communication(Allowing the methods that come as Cross 
    // Domain Request
    
    MongoClient.connect("mongodb://ds055690.mongolab.com:55690/buytheworld", function (err, db) {
        if (err) {
            console.log("ERROR connecting to MongoDB: " + err);
            res.json([{ "Code": "ERROR_CONNECTING" }]);
        }
        else {
            console.log("Connected to MongoDB");
            //Authenticate after connecting
            db.authenticate('cognito_btw', 'G6rzc4dlr', function (authErr, success) {
                if (authErr) {
                    console.log("ERROR authenticating to MongoDB: " + err);
                    res.json([{ "Code": "ERROR_AUTHENTICATING" }]);
                }
                else {
                    console.log("Authenticated to MongoDB");
                    
                    //Check if already added, do this by Latitude and Longitude
                    console.log("Searching for " + req.body.geometry.location.lat + " , " + req.body.geometry.location.lng);
                    db.collection("place").findOne({ "geometry.location.lat": req.body.geometry.location.lat, 'geometry.location.lng': req.body.geometry.location.lng }, function (err, places) {
                        //collection.find().toArray(function (err, places) {
                        if (err) {
                            console.log("ERROR retrieving data: " + err);
                            res.json([{ "Code": "ERROR_RETRIEVING" }]);
                        }
                        else {
                            console.log("retrieved records:");
                            console.log(places);
                            if (places === null) {
                                db.collection('place').insert(req.body, function (err, inserted) {
                                    if (err) {
                                        console.log("ERROR inserting Place: " + err);
                                        res.json([{ "Code": "ERROR_SAVING" }]);
                                    }
                                    else {
                                        console.log("Place well inserted");
                                        res.json([{ "Code": "SAVED" }]);
                                    }
                                });
                            }
                            else {
                                console.log("Place " + req.body.geometry.location.lat + " , " + req.body.geometry.location.lng + " already exists: " + places.name);
                                res.json([{ "Code": "EXISTS" }]);
                            }
                        }
                    });
                }
            });
        }
    });
});

router.post('/setUser', function (req, res) {
    console.log("setUser POST");
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    // The above 2 lines are required for Cross Domain Communication(Allowing the methods that come as Cross 
    // Domain Request
    
    MongoClient.connect("mongodb://ds055690.mongolab.com:55690/buytheworld", function (err, db) {
        if (err) {
            console.log("ERROR connecting to MongoDB: " + err);
            res.json([{ "Code": "ERROR_CONNECTING" }]);
        }
        else {
            console.log("Connected to MongoDB");
            //Authenticate after connecting
            db.authenticate('cognito_btw', 'G6rzc4dlr', function (authErr, success) {
                if (authErr) {
                    console.log("ERROR authenticating to MongoDB: " + err);
                    res.json([{ "Code": "ERROR_AUTHENTICATING" }]);
                }
                else {
                    console.log("Authenticated to MongoDB");
                    
                    //Check if already added, do this by Latitude and Longitude
                    db.collection("user").findOne({ "email": req.body.email}, function (err, user) {
                        //collection.find().toArray(function (err, places) {
                        if (err) {
                            console.log("ERROR retrieving data: " + err);
                            res.json([{ "Code": "ERROR_RETRIEVING" }]);
                        }
                        else if (user == null) {
                            //Add user to DB
                            db.collection('user').insert(req.body, function (err, inserted) {
                                if (err) {
                                    console.log("ERROR inserting User: " + err);
                                    res.json([{ "Code": "ERROR_SAVING" }]);
                                }
                                else {
                                    console.log("User well inserted");
                                    //Give user start wallet
                                    db.collection('user').findOne({ "email": req.body.email }, function (err, user) {
                                        if (err) {
                                            console.log("ERROR checking user: " + err);
                                            res.json([{ "Code": "ERROR_RETRIEVING" }]);
                                        }
                                        else if (user == null) {
                                            console.log("ERROR: User has just been saved, but impossible to fetch");
                                            res.json([{ "Code": "ERROR_RETRIEVING" }]);
                                        }
                                        else {
                                            db.collection('wallet').insert({ "userId": user._id, "amount": 100000}, function (err, wallet) {
                                                if (err) {
                                                    console.log("ERROR inserting Wallet: " + err);
                                                    res.json([{ "Code": "ERROR_SAVING" }]);
                                                }
                                                else {
                                                    console.log("Wallet well inserted");
                                                    res.json([{ "Code": "SAVED" }]);
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                        else {
                            console.log("User with email " + req.body + " already exist: " + user.firstname + " " + user.lastname);
                            res.json([{ "Code": "USER_EXISTS" }]);
                        }
                    });
                }
            });
        }
    });
});

router.post('/buyPlace', function (req, res) {
    console.log("buyPlace POST");
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    // The above 2 lines are required for Cross Domain Communication(Allowing the methods that come as Cross 
    // Domain Request
    
    MongoClient.connect("mongodb://ds055690.mongolab.com:55690/buytheworld", function (err, db) {
        if (err) {
            console.log("ERROR connecting to MongoDB: " + err);
            res.json([{ "Code": "ERROR_CONNECTING" }]);
        }
        else {
            console.log("Connected to MongoDB");
            //Authenticate after connecting
            db.authenticate('cognito_btw', 'G6rzc4dlr', function (authErr, success) {
                if (authErr) {
                    console.log("ERROR authenticating to MongoDB: " + err);
                    res.json([{ "Code": "ERROR_AUTHENTICATING" }]);
                }
                else {
                    console.log("Authenticated to MongoDB");
                    
                    //Check if the user exists
                    var mongo = require('mongodb')
                    var BSON = mongo.BSONPure;

                    db.collection("user").findOne({ "_id": new BSON.ObjectID(req.body.userId)}, function (err, user) {
                        if (err) {
                            console.log("ERROR retrieving user: " + err);
                            res.json([{ "Code": "ERROR_RETRIEVING" }]);
                        }
                        else if (user == null) {
                            console.log("User " + req.body.userId + " does not exists!");
                            res.json([{ "Code": "USER_UNKNOWN" }]);
                        }
                        else {
                            //User exists, check place
                            console.log("User does exists:" + user.firstname + " " + user.lastname);
                            db.collection("place").findOne({ "id": req.body.placeId }, function (err, place) {
                                if (err) {
                                    console.log("ERROR retrieving user: " + err);
                                    res.json([{ "Code": "ERROR_RETRIEVING" }]);
                                }
                                else if (place == null) {
                                    console.log("Place " + req.body.placeId + " with type " + req.body.placeType + " does not exists!");
                                    res.json([{ "Code": "PLACE_UNKNOWN" }]);
                                }
                                else {
                                    console.log("Place does exists: " + place.name);
                                    //Check if userPlace exists
                                    db.collection("userPlace").findOne(req.body, function (err, userP) {
                                        if (err) {
                                            console.log("ERROR retrieving user: " + err);
                                            res.json([{ "Code": "ERROR_RETRIEVING" }]);
                                        }
                                        else if (userP == null) {
                                            console.log("UserPlace does not exists, saving now");
                                            //Add place to user
                                            var userPlace = [ {
                                                    "userId": new BSON.ObjectID(user._id),
                                                    "placeId": new BSON.ObjectID(place._id),
                                                    "placeType": req.body.placeType,
                                                    "price": req.body.price,
                                                    "name": place.name,
                                                    "lat": place.geometry.location.lat,
                                                    "lng": place.geometry.location.lng,
                                                    "icon": place.icon,
                                                    "createdTS": new Date().getTime(),
                                                    "lastCashedTS": new Date().getTime()
                                                }];
                                            db.collection('userPlace').insert( userPlace, function (err, inserted) {
                                                    if (err) {
                                                        console.log("ERROR inserting UserPlace: " + err);
                                                        res.json([{ "Code": "ERROR_SAVING" }]);
                                                    }
                                                    else {
                                                        console.log("UserPlace well inserted");
                                                        res.json([{ "Code": "SAVED" }]);
                                                    }
                                            });
                                        }
                                        else {
                                            console.log("userPlace does exists");
                                            res.json([{ "Code": "ALREADY_SAVED" }]);
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

router.get('/getMyWorld', function (req, res) {
    console.log("getMyWorld GET");
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    // The above 2 lines are required for Cross Domain Communication(Allowing the methods that come as Cross 
    // Domain Request
    
    MongoClient.connect("mongodb://ds055690.mongolab.com:55690/buytheworld", function (err, db) {
        if (err) {
            console.log("ERROR connecting to MongoDB: " + err);
            res.json([{ "Code": "ERROR_CONNECTING" }]);
        }
        else {
            console.log("Connected to MongoDB");
            //Authenticate after connecting
            db.authenticate('cognito_btw', 'G6rzc4dlr', function (authErr, success) {
                if (authErr) {
                    console.log("ERROR authenticating to MongoDB: " + err);
                    res.json([{ "Code": "ERROR_AUTHENTICATING" }]);
                }
                else {
                    console.log("Authenticated to MongoDB");
                    
                    //Check if the user exists
                    var mongo = require('mongodb')
                    var BSON = mongo.BSONPure;
                    
                    console.log("BODY:");
                    console.log(req.body);

                    db.collection("userPlace").find({ "userId": new BSON.ObjectID(req.body.userId) }).toArray(function (err, places) {
                        if (err) {
                            console.log("ERROR retrieving data: " + err);
                            res.json([{ "Code": "ERROR_RETRIEVING" }]);
                        }
                        else {
                            console.log("retrieved records:");
                            console.log(places);
                            res.json(places)
                        }
                    });
                }
            });
        }
    });
});


router.get('/getPrice', function (req, res) {
    console.log("getPrice GET");
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    // The above 2 lines are required for Cross Domain Communication(Allowing the methods that come as Cross 
    // Domain Request
    
    console.log("Searching for " + req.body.name + ' - ' + req.body.vicinity);
    
    request("https://www.google.be/search?hl=en&q=" + req.body.name.replace(/\s+/g, '+') + "+" + req.body.vicinity.replace(/\s+/g, '+'), function (error, response, body) {
        if (!error) {
            console.log("SUCCESS: " + body)
            // <div id="resultStats">About 7.630 results
            var searchString = 'id="resultStats">About ';
            var resultString = body.indexOf(searchString);
            var price = body.substring(resultString + searchString.length, body.indexOf(' ', resultString + searchString.length));
            console.log("PRICE: " + price);
            res.json([{ "status": "VALID", "price": price }]);
        } else {
            res.json([{ "status": "ERROR", "price": -1 }]);
        }
    });
});

module.exports = router;