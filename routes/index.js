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
        if (err) { res.json([{ "Code": "Error making connection: " + err }]); }
        else {
            //Authenticate after connecting
            client.authenticate('cognito_btw', 'G6rzc4dlr', function (authErr, success) {
                if (authErr) { res.json([{ "Code": "Error Authentication: " + authErr }]); }
                else {
                    var places = db.collection('place');
                    places.find().toArray(function (err, docs) {
                        console.log("retrieved records:");
                        console.log(docs);
                    });
                    res.json(places.find());
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
                    var placeExists = db.collection('place').findOne({ 'geometry.location.lat': 50.849838, 'geometry.location.lng': 4.733769 });
                    if (placeExists === undefined) {
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
                        console.log("Place " + req.body.geometry.location.lat + " , " + req.body.geometry.location.lng + " already exists: " + placeExists.name);
                        res.json([{ "Code": "EXISTS" }]);
                    }
                }
            });
        }
    });
});

router.get('/getPlace', function (req, res) {
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
                    //console.log("Searching for " + req.body.geometry.location.lat + " , " + req.body.geometry.location.lng);
                    var placeExists = db.collection('place').findOne({ "geometry.location.lat": 50.849838, "geometry.location.lng": 4.733769 });
                    if (placeExists === undefined) {
                        console.log("place does not exists");
                    }
                    else {
                        console.log("Place exists: " + placeExists);
                        //console.log("Place " + req.body.geometry.location.lat + " , " + req.body.geometry.location.lng + " already exists: " + placeExists.name);
                        res.json([{ "Code": "EXISTS" }]);
                    }
                }
            });
        }
    });
});

router.get('/getPrice', function (req, res) {
    console.log("getPrice POST");
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