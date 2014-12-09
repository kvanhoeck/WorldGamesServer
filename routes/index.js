﻿var express = require('express');
var router = express.Router();
var request = require('request');
var MongoClient = require('mongodb').MongoClient;

function throwError(res, code, message, error) {
    console.log("ERROR: " + message);
    console.log("More info: " + error);
    res.status(code);
    res.send(message);
}

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

router.get('/getAllPlaces', function (req, res) {
    console.log("getAllPlaces GET");
    MongoClient.connect("mongodb://ds055690.mongolab.com:55690/buytheworld", function (err, db) {
        if (err) throwError(res, 400, "Could not connect to the database", err);
        else {
            console.log("Connected to MongoDB");
            //Authenticate after connecting
            db.authenticate('cognito_btw', 'G6rzc4dlr', function (authErr, success) {
                if (authErr) throwError(res, 400, "Could not authenticate with the database", authErr);
                else {
                    console.log("Authenticated to MongoDB");
                    db.collection("place").find().toArray(function (err, places) {
                        if (err) throwError(res, 400, "Could not retreive Place", err);
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
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    // The above 2 lines are required for Cross Domain Communication(Allowing the methods that come as Cross 
    // Domain Request
    
    MongoClient.connect("mongodb://ds055690.mongolab.com:55690/buytheworld", function (err, db) {
        if (err) throwError(res, 400, "Could not connect to the database", err);
        else {
            console.log("Connected to MongoDB");
            //Authenticate after connecting
            db.authenticate('cognito_btw', 'G6rzc4dlr', function (authErr, success) {
                if (authErr) throwError(res, 400, "Could not authenticate with the database", authErr);
                else {
                    console.log("Authenticated to MongoDB");
                    
                    //Check if already added, do this by Latitude and Longitude
                    console.log("Searching for " + req.body.geometry.location.lat + " , " + req.body.geometry.location.lng);
                    db.collection("place").findOne({ "geometry.location.lat": req.body.geometry.location.lat, 'geometry.location.lng': req.body.geometry.location.lng }, function (err, places) {
                        //collection.find().toArray(function (err, places) {
                        if (err) throwError(res, 400, "Could not retreive Place", err);
                        else {
                            console.log("retrieved records:");
                            console.log(places);
                            if (places === null) {
                                db.collection('place').insert(req.body, function (err, inserted) {
                                    if (err) throwError(res, 400, "Could not insert new Place", err);
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
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    // The above 2 lines are required for Cross Domain Communication(Allowing the methods that come as Cross 
    // Domain Request
    
    MongoClient.connect("mongodb://ds055690.mongolab.com:55690/buytheworld", function (err, db) {
        if (err) throwError(res, 400, "Could not connect to the database", err);
        else {
            console.log("Connected to MongoDB");
            //Authenticate after connecting
            db.authenticate('cognito_btw', 'G6rzc4dlr', function (authErr, success) {
                if (authErr) throwError(res, 400, "Could not authenticate with the database", authErr);
                else {
                    console.log("Authenticated to MongoDB");
                    
                    //Check if already added, do this by Latitude and Longitude
                    db.collection("user").findOne({ "email": req.body.email}, function (err, user) {
                        //collection.find().toArray(function (err, places) {
                        if (err) throwError(res, 400, "Could not retreive User", err);
                        else if (user == null) {
                            //Add user to DB
                            db.collection('user').insert(req.body, function (err, inserted) {
                                if (err) throwError(res, 400, "Could not insert new User", err);
                                else {
                                    console.log("User well inserted");
                                    //Give user start wallet
                                    db.collection('user').findOne({ "email": req.body.email }, function (err, user) {
                                        if (err) throwError(res, 400, "Could not retreive User", err);
                                        else if (user == null) throwError(res, 400, "Could not retreive User", "User has just been saved, but impossible to fetch");
                                        else {
                                            db.collection('wallet').insert({ "userId": user._id, "amount": 100000}, function (err, wallet) {
                                                if (err) throwError(res, 400, "Could not insert new Wallet", err);
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
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    // The above 2 lines are required for Cross Domain Communication(Allowing the methods that come as Cross 
    // Domain Request
    
    MongoClient.connect("mongodb://ds055690.mongolab.com:55690/buytheworld", function (err, db) {
        if (err) throwError(res, 400, "Could not connect to the database", err);
        else {
            console.log("Connected to MongoDB");
            //Authenticate after connecting
            db.authenticate('cognito_btw', 'G6rzc4dlr', function (authErr, success) {
                if (authErr) throwError(res, 400, "Could not authenticate to the database", authErr);
                else {
                    console.log("Authenticated to MongoDB");
                    
                    //Check if the user exists
                    var mongo = require('mongodb')
                    var BSON = mongo.BSONPure;
                    console.log("Received:");
                    console.log(req.body);

                    db.collection("user").findOne({ "_id": new BSON.ObjectID(req.body.userId)}, function (err, user) {
                        if (err) throwError(res, 400, "Could not retreive user", err);
                        else if (user == null) throwError(res, 400, "User " + req.body.userId + " does not exists!", "User is null");
                        else {
                            //User exists, check place
                            console.log("User does exists:" + user.firstname + " " + user.lastname);
                            db.collection("place").findOne({ "id": req.body.placeId }, function (err, place) {
                                if (err) throwError(res, 400, "Could not retreive place", err);
                                else if (place == null) throwError(res, 400,"The selected place does not exists", "Place " + req.body.placeId + " with type " + req.body.placeType + " does not exists!");
                                else {
                                    console.log("Place does exists: " + place.name);
                                    //Check if userPlace exists
                                    db.collection("userPlace").findOne(req.body, function (err, userP) {
                                        if (err) throwError(res, 400, "Could not retreive link between user and place", err);
                                        else if (userP == null) {
                                            console.log("UserPlace does not exists, checking wallet");
                                            //Check if user has enough money
                                            db.collection("wallet").findOne({ "userId": new BSON.ObjectID(req.body.userId) }, function (err, wallet) {
                                                if (err) throwError(res, 400, "Could not retreive wallet", err);
                                                else {
                                                    if (wallet.amount < req.body.price) throwError(res, 400, "You do not have enough money to buy this place", "To little in wallet: " + wallet.amount + " < " + req.body.price);
                                                    else {
                                                        //Add place to user
                                                        var userPlace = [{
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
                                                        db.collection('userPlace').insert(userPlace, function (err, inserted) {
                                                            if (err) throwError(res, 400, "Could not insert new link between user and place", err);
                                                            else {
                                                                console.log("UserPlace well inserted");
                                                                res.json([{ "Code": "SAVED" }]);
                                                            }
                                                        });
                                                        //Substract price of wallet
                                                        db.collection("wallet").update({ _id : wallet._id }, { userId: wallet.userId, amount: (wallet.amount - req.place.price) }, function (err, wal) {
                                                            if (err) throwError(res, 400, "Could not update the wallet", err);
                                                            else {
                                                                console.log("Wallet updated");
                                                                res.json([{ "Code": "SAVED" }]);
                                                            }
                                                        });
                                                    }
                                                }
                                            })
                                        }
                                        else throwError(res, 400, "Could not retreive link between user and place", "userPlace does exists");
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

router.post('/getMyWorld', function (req, res) {
    console.log("getMyWorld POST");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    // The above 2 lines are required for Cross Domain Communication(Allowing the methods that come as Cross 
    // Domain Request
    
    MongoClient.connect("mongodb://ds055690.mongolab.com:55690/buytheworld", function (err, db) {
        if (err) throwError(res, 400, "Could not connect to the database", err);
        else {
            console.log("Connected to MongoDB");
            //Authenticate after connecting
            db.authenticate('cognito_btw', 'G6rzc4dlr', function (authErr, success) {
                if (authErr) throwError(res, 400, "Could not authenticate with the database", authErr);
                else {
                    console.log("Authenticated to MongoDB");
                    
                    //Check if the user exists
                    var mongo = require('mongodb')
                    var BSON = mongo.BSONPure;
                    
                    console.log("Searching for " + req.body.userId);

                    db.collection("userPlace").find({ "userId": new BSON.ObjectID(req.body.userId) }).toArray(function (err, places) {
                        if (err) throwError(res, 400, "Could not retreive link between user and place", err);
                        else {
                            console.log("retrieved records:");
                            console.log(places);
                            console.log("Sending this back to requester");
                            res.json(places);
                        }
                    });
                }
            });
        }
    });
});

router.post('/getMyCapital', function (req, res) {
    console.log("getMyCapital POST");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "POST");
    // The above 2 lines are required for Cross Domain Communication(Allowing the methods that come as Cross 
    // Domain Request
    
    MongoClient.connect("mongodb://ds055690.mongolab.com:55690/buytheworld", function (err, db) {
        if (err) throwError(res, 400, "Could not connect to the database", err);
        else {
            console.log("Connected to MongoDB");
            //Authenticate after connecting
            db.authenticate('cognito_btw', 'G6rzc4dlr', function (authErr, success) {
                if (authErr) throwError(res, 400, "Could not authenticate with the database", authErr);
                else {
                    console.log("Authenticated to MongoDB");
                    
                    //Check if the user exists
                    var mongo = require('mongodb')
                    var BSON = mongo.BSONPure;
                    
                    console.log("Searching for " + req.body.userId);
                    
                    db.collection("wallet").find({ "userId": new BSON.ObjectID(req.body.userId) }).toArray(function (err, wallet) {
                        if (err) throwError(res, 400, "Could not retreive Wallet", err);
                        else {
                            console.log("retrieved records:");
                            console.log(wallet);
                            console.log("Sending this back to requester");
                            res.json(wallet);
                        }
                    });
                }
            });
        }
    });    
});

router.post('/getPrice', function (req, res) {
    console.log("getPrice POST");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "POST");
    // The above 2 lines are required for Cross Domain Communication(Allowing the methods that come as Cross 
    // Domain Request
    
    console.log("Searching for " + req.body.name + ' - ' + req.body.vicinity);
    
    request("https://www.google.be/search?hl=en&q=" + req.body.name.replace(/\s+/g, '+') + "+" + req.body.vicinity.replace(/\s+/g, '+'), function (error, response, body) {
        if (!error) {
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