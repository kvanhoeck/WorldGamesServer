var express = require('express');
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
   
    var Fiber = require('fibers');
    var MongoSync = require("mongo-sync");
    
    Fiber(function () {
        try {
            var db = getDB();
            var jsonBody = JSON.stringify(req.body);
            
            var user = db.getCollection("user").findOne({ "_id.$oid": req.body.userId });
            var place = db.getCollection("place").findOne({ "geometry.location.lat": req.body[0].lat, "geometry.location.lng": req.body[0].lng });
            var userPlace = db.getCollection("userPlace").findOne({ "userId.$oid": req.body.userId, "placeId": req.body[0].placeId, "placeType": req.body[0].placeType });
            
            if (user == null)
                throwError(res, 400, "Could not retreive User", "User is null");
            else if (place == null)
                throwError(res, 400, "Could not retreive Place", "Place is null");
            else if (userPlace !== null)
                throwError(res, 400, "You already bought this place for " + userPlace.price + "€", "User already owns this place");
            else {
                var wallet = db.getCollection("wallet").findOne({ "userId.$oid": req.body.userId });
                
                if (wallet == null)
                    throwError(res, 400, "Could not retreive Wallet", "Wallet is null");
                else {
                    if (wallet.amount < req.body.price) throwError(res, 400, "You do not have enough money to buy this place", "To little in wallet: " + wallet.amount + " < " + req.body[0].price);
                    else {
                        //Add place to user
                        var BSON = require('mongodb').BSONPure;
                        var userPlace = [ {
                                "userId": new BSON.ObjectID(user._id),
                                "placeId": place.id,
                                "placeType": req.body[0].placeType,
                                "price": req.body[0].price,
                                "name": place.name,
                                "lat": place.geometry.location.lat,
                                "lng": place.geometry.location.lng,
                                "icon": place.icon,
                                "createdTS": new Date().getTime(),
                                "lastCashedTS": new Date().getTime(),
                                "lastCheckInTS" : new Date().getTime()
                            }];
                        db.getCollection('userPlace').insert(userPlace);
                        console.log("UserPlace well inserted");
                        //Substract price of wallet
                        db.getCollection("wallet").update({ _id : wallet._id }, { userId: wallet.userId, amount: (wallet.amount - req.body[0].price) });
                    }
                }
            }
        }
        catch (e) {
            console.log("ERROR: " + e);
            throwError(res, 400, "Woops: " + e, e);
        }
    }).run();
});

router.post('/getMyWorld', function (req, res) {
    console.log("getMyWorld POST");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    // The above 2 lines are required for Cross Domain Communication(Allowing the methods that come as Cross 
    // Domain Request
    
    var Fiber = require('fibers');
    var MongoSync = require("mongo-sync");
    
    Fiber(function () {
        try {
            var db = getDB();
            var jsonBody = JSON.stringify(req.body);
            
            var user = db.getCollection("user").findOne({ "_id.$oid": jsonBody.userId });
            //old code: db.collection("userPlace").find({ "userId": new BSON.ObjectID(req.body.userId) }).toArray(function (err, places) {
            var userPlaces = db.getCollection("userPlace").find({ "userId.$oid": req.body.userId});
            
            if (user == null)
                throwError(res, 400, "Could not retreive User", "User is null");
            else if (userPlaces == null)
                throwError(res, 400, "Could not retreive link between User and Place", "UserPlace is null");
            else {
                console.log("GetMyWorld: User found: " + user.length);
                console.log("GetMyWorld: Places found: " + userPlaces.length);
                var result = [];
                userPlaces.forEach(function (up) {
                    console.log("GetMyWorld: Found " + up.name);
                    result.push(up);
                });
                res.json(result);
            }
        } catch (e) {
            console.log("ERROR: " + e);
            throwError(res, 400, "Woops: " + e, e);
        }
    }).run();

    //MongoClient.connect("mongodb://ds055690.mongolab.com:55690/buytheworld", function (err, db) {
    //    if (err) throwError(res, 400, "Could not connect to the database", err);
    //    else {
    //        console.log("Connected to MongoDB");
    //        //Authenticate after connecting
    //        db.authenticate('cognito_btw', 'G6rzc4dlr', function (authErr, success) {
    //            if (authErr) throwError(res, 400, "Could not authenticate with the database", authErr);
    //            else {
    //                console.log("Authenticated to MongoDB");
                    
    //                //Check if the user exists
    //                var mongo = require('mongodb')
    //                var BSON = mongo.BSONPure;
                    
    //                console.log("Searching for " + req.body.userId);

    //                db.collection("userPlace").find({ "userId": new BSON.ObjectID(req.body.userId) }).toArray(function (err, places) {
    //                    if (err) throwError(res, 400, "Could not retreive link between user and place", err);
    //                    else {
    //                        console.log("retrieved records:");
    //                        console.log(places);
    //                        console.log("Sending this back to requester");
    //                        res.json(places);
    //                    }
    //                });
    //            }
    //        });
    //    }
    //});

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

router.post('/cashPlace', function (req, res) {
    console.log("cashPlace POST");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    // The above 2 lines are required for Cross Domain Communication(Allowing the methods that come as Cross 
    // Domain Request
    
    var Fiber = require('fibers');
    var MongoSync = require("mongo-sync");
    
    Fiber(function () {
        try {
            var db = getDB();
            var jsonBody = JSON.stringify(req.body);
            
            var user = db.getCollection("user").findOne({ "_id.$oid": jsonBody.userId });
            var userPlace = db.getCollection("userPlace").findOne({ "userId.$oid": req.body.userId, "placeId": req.body[0].placeId, "placeType": req.body[0].placeType });
            var wallet = db.getCollection("wallet").findOne({ "userId.$oid": jsonBody.userId });
            
            if (user == null)
                throwError(res, 400, "Could not retreive User", "User is null");
            else if (userPlace == null)
                throwError(res, 400, "Could not retreive link between User and Place", "UserPlace is null");
            else if (wallet == null)
                throwError(res, 400, "Could not retreive Wallet", "Wallet is null");
            else {
                var now = new Date();
                var seconds = ((now.getTime() - userPlace.lastCashedTS) * .001) >> 0;
                console.log("Last cashed TS was " + seconds + " seconds ago");
                var profit = userPlace.price / 2592000 * seconds;
                console.log("Provit is " + profit);
                console.log("Provit is " + profit.toFixed(4));
                
                //Save profit to wallet
                db.getCollection("wallet").update({ _id : wallet._id }, { userId: wallet.userId, amount: (parseInt(wallet.amount) + parseInt(profit.toFixed(4))) });
                //Save new lastCashedTS to userPlace
                db.getCollection("userPlace").update({ _id : userPlace._id }, {
                    userId : userPlace.userId, 
                    placeId: userPlace.placeId, 
                    placeType: userPlace.placeType, 
                    price: userPlace.price, 
                    name: userPlace.name,
                    lat: userPlace.lat,
                    lng: userPlace.lng,
                    icon: userPlace.icon,
                    createdTS: userPlace.createdTS,
                    lastCashedTS: now.getTime(),
                    lastCheckInTS: userPlace.lastCheckInTS
                });

                res.json([{ "Code": "SAVED", "Message": "Cashed €" + profit.toFixed(4) }]);
            }
        } catch (e) {
            console.log("ERROR: " + e);
            throwError(res, 400, "Woops: " + e, e);
        }
    }).run();
});

router.post('/checkInPlace', function (req, res) {
    console.log("cashPlace POST");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    // The above 2 lines are required for Cross Domain Communication(Allowing the methods that come as Cross 
    // Domain Request
    
    var Fiber = require('fibers');
    var MongoSync = require("mongo-sync");
    
    Fiber(function () {
        try {
            var db = getDB();
            var jsonBody = JSON.stringify(req.body);
            
            var user = db.getCollection("user").findOne({ "_id.$oid": jsonBody.userId });
            var userPlace = db.getCollection("userPlace").findOne({ "userId.$oid": req.body.userId, "placeId": req.body[0].placeId, "placeType": req.body[0].placeType });
            var wallet = db.getCollection("wallet").findOne({ "userId.$oid": jsonBody.userId });
            
            if (user == null)
                throwError(res, 400, "Could not retreive User", "User is null");
            else if (userPlace == null)
                throwError(res, 400, "Could not retreive link between User and Place", "UserPlace is null");
            else if (wallet == null)
                throwError(res, 400, "Could not retreive Wallet", "Wallet is null");
            else {
                var oneDay = 24 * 60 * 60 * 1000;
                var now = new Date();
                console.log("CheckInPlace: Calculating days between " + now.toISOString().slice(0, 10).replace(/-/g, "") + " and " + userPlace.lastCheckInTS);
                var diffDays = parseInt(now.toISOString().slice(0, 10).replace(/-/g, "")) - parseInt(userPlace.lastCheckInTS);
                console.log("CheckInPlace: Last Checked In TS was " + diffDays + " days ago");
                if (diffDays > 0) {
                    //1 week
                    var profit = (userPlace.price / 2592000) * 604800;
                    console.log("CheckInPlace: Provit is " + profit);
                    console.log("CheckInPlace: Provit is " + profit.toFixed(4));
                    
                    //Save profit to wallet
                    db.getCollection("wallet").update({ _id : wallet._id }, { userId: wallet.userId, amount: (parseInt(wallet.amount) + parseInt(profit.toFixed(4))) });
                    //Save new lastCashedTS to userPlace
                    db.getCollection("userPlace").update({ _id : userPlace._id }, {
                        userId : userPlace.userId, 
                        placeId: userPlace.placeId, 
                        placeType: userPlace.placeType, 
                        price: userPlace.price, 
                        name: userPlace.name,
                        lat: userPlace.lat,
                        lng: userPlace.lng,
                        icon: userPlace.icon,
                        createdTS: userPlace.createdTS,
                        lastCashedTS: userPlace.lastCashedTS,
                        lastCheckInTS: now.toISOString().slice(0, 10).replace(/-/g, "")
                    });
                    
                    res.json([{ "Code": "SAVED", "Message": "Cashed €" + profit.toFixed(4) }]);
                }
                else {
                    throwError(res, 400, "Already checked in today!", "Already checked in today!");
                }
            }
        } catch (e) {
            console.log("CheckInPlace: ERROR: " + e);
            throwError(res, 400, "Woops: " + e, e);
        }
    }).run();
});


router.post('/resetWallet', function (req, res) {
    console.log("resetWallet POST");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    // The above 2 lines are required for Cross Domain Communication(Allowing the methods that come as Cross 
    // Domain Request
    
    var Fiber = require('fibers');
    var MongoSync = require("mongo-sync");
    
    Fiber(function () {
        try {
            var db = getDB();
            var jsonBody = JSON.stringify(req.body);
            
            var user = db.getCollection("user").findOne({ "_id.$oid": jsonBody.userId });
            var wallet = db.getCollection("wallet").findOne({ "userId.$oid": jsonBody.userId });
            
            if (user == null)
                throwError(res, 400, "Could not retreive User", "User is null");
            else if (wallet == null)
                throwError(res, 400, "Could not retreive Wallet", "Wallet is null");
            else {
                db.getCollection("wallet").update({ _id : wallet._id }, { userId: wallet.userId, amount: parseInt(req.body[0].resetValue) });
                
                res.json([{ "Code": "SAVED" }]);
            }
        } catch (e) {
            console.log("ERROR: " + e);
            throwError(res, 400, "Woops: " + e, e);
        }
    }).run();
});

router.post('/findMyPlacesNearby', function (req, res) {
    console.log("findMyPlacesNearby POST");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    // The above 2 lines are required for Cross Domain Communication(Allowing the methods that come as Cross 
    // Domain Request
    
    var Fiber = require('fibers');
    var MongoSync = require("mongo-sync");
    
    
    Fiber(function () {
        try {
            var db = getDB();
            var jsonBody = JSON.stringify(req.body);
            
            var user = db.getCollection("user").findOne({ "_id.$oid": jsonBody.userId });
            
            if (user == null)
                throwError(res, 400, "Could not retreive User", "User is null");
            else {
                var mongo = require('mongodb')
                var BSON = mongo.BSONPure;
                
                console.log("FindMyPlacesNearby: Received JSON " + jsonBody);
                console.log("FindMyPlacesNearby: Searching places between " + (parseFloat(req.body[0].lat) - 0.01) + " and " + (parseFloat(req.body[0].lat) + 0.01));
                console.log("FindMyPlacesNearby: Searching places between " + (parseFloat(req.body[0].lng) - 0.01) + " and " + (parseFloat(req.body[0].lng) + 0.01));
                var myLocations = db.getCollection("userPlace").find(
                    {
                        "$and": [   { "userId.$oid": req.body.userId },
                                    { "lat": { "$gt": (parseFloat(req.body[0].lat) - 0.01) } }, 
                                    { "lat": { "$lt": (parseFloat(req.body[0].lat) + 0.01) } },
                                    { "lng": { "$gt": (parseFloat(req.body[0].lng) - 0.01) } },
                                    { "lng": { "$lt": (parseFloat(req.body[0].lng) + 0.01) } }
                        ]
                    });
                var result = [];
                myLocations.forEach(function (location) {
                    console.log("FindMyPlacesNearby: Found " + location.name);
                    result.push(location);
                });
                //console.log("FindMyPlacesNearby: Sending this back to requester");
                res.json(result);
            }
        } catch (e) {
            console.log("ERROR: " + e);
            throwError(res, 400, "Woops: " + e, e);
        }
    }).run();
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

function getDB() {
    var Fiber = require('fibers');
    var MongoSync = require("mongo-sync");

    var db = new MongoSync.Server().connect("mongodb://ds055690.mongolab.com:55690/buytheworld");
    db.auth("cognito_btw", "G6rzc4dlr");

    return db;
}

module.exports = router;