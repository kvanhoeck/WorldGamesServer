var express = require('express');
var router = express.Router();

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
//var Server = mongo.Server,
//    Db = mongo.Db,
//    BSON = mongo.BSONPure;

//var server = new Server('ds055690.mongolab.com', 55690, { auto_reconnect: true });
//db = new Db('buytheworld', server);

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
    console.log(req.body);
    console.log("NAME:");
    console.log(req.body.name);
    
    MongoClient.connect("mongodb://ds055690.mongolab.com:55690/buytheworld", function (err, db) {
        if (err) {
            console.log("ERROR connecting to MongoDB: " + err);
            res.json([{ "Code": "Error making connection: " + err }]);
        }
        else {
            console.log("Connected to MongoDB");
            //Authenticate after connecting
            db.authenticate('cognito_btw', 'G6rzc4dlr', function (authErr, success) {
                if (authErr) {
                    console.log("ERROR authenticating to MongoDB: " + err);
                    res.json([{ "Code": "Error Authentication: " + authErr }]);
                }
                else {
                    console.log("Authenticated to MongoDB");
                    var places = db.collection('place');
                    console.log("Collection 'Place' is known");
                    places.insert(req.body, function (err, inserted) {
                        if (err) {
                            console.log("ERROR inserting Place: " + err);
                            res.json([{ "Code": "SAVED" }]);
                        }
                        else {
                            console.log("Place well inserted");
                            res.json([{ "Code": "SAVED" }]);
                        }
                    });
                    
                }
            });
        }
    });

    //db.places.save({ name: jsonData.name, lat: jsonData.geometry.location.lat, lng: jsonData.geometry.location.lng, icon: jsonData.icon, types: jsonData.types },
    //   function (err, saved)
    //{
    
    //    // Query in MongoDB via Mongo JS Module
    //    if (err || !saved)
    //        res.json([{ "Code": "SAVED" }]);
    //    else
    //        res.json([{ "Code": "NOT SAVED" }]);
    //});
});


module.exports = router;