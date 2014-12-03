var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', { title: 'World Games Server' });
});

router.get('/api/flags', function (req, res) {
    console.log("Getting flags...");
    res.json(  [ { "id": 1, "name": "Koen" },
                { "id": 2, "name": "Stéphanie" },
                { "id": 3, "name": "Febe" },
                { "id": 4, "name": "Randy" }
               ])
});

var mongo = require('mongodb');
var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var server = new Server('ds055690.mongolab.com', 55690, { auto_reconnect: true });
db = new Db('buytheworld', server);

router.get('/getAllPlaces', function (req, res) {
    
    db.open(function (err, client) {
        if (!err) {
            client.authenticate('cognito_btw', 'G6rzc4dlr', function (authErr, success) {
                if (authErr) {
                    return console.dir(authErr);
                }
                var stream = client.collection('places').find({}).stream();
                stream.on('data', function (item) {
                    res.writeHead(200, { 'Content-Type': 'application/json' }); // Sending data via json
                    str = '[';
                    stream.forEach(function (place) {
                        str = str + '{ "name" : "' + place.name + '"},' + '\n';
                    });
                    str = str.trim();
                    str = str.substring(0, str.length - 1);
                    str = str + ']';
                    res.end(str);
                });
                stream.on('end', function () {
                    console.log("Empty!");
                });
            });

        }
    });

    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Origin", "http://*.mongolab.com");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    // The above 2 lines are required for Cross Domain Communication(Allowing the methods that come as Cross           // Domain Request
    db.places.find('', function (err, places)
    {
    // Query in MongoDB via Mongo JS Module
        if (err || !places) console.log("No places found");
        else {
            res.writeHead(200, { 'Content-Type': 'application/json' }); // Sending data via json
            str = '[';
            places.forEach(function (place) {
                str = str + '{ "name" : "' + place.name + '"},' + '\n';
            });
            str = str.trim();
            str = str.substring(0, str.length - 1);
            str = str + ']';
            res.end(str);
                // Prepared the jSon Array here
        }
    });
});

router.post('/setPlace', function (req, res) {
    console.log("setPlace");
    process.stdout.write("setPlace");
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    // The above 2 lines are required for Cross Domain Communication(Allowing the methods that come as Cross 
    // Domain Request
    console.log(req.body);
    console.log(req.body.mydata);
    var jsonData = JSON.parse(req.body.mydata);
    
    db.place.save({ name: jsonData.name, lat: jsonData.geometry.location.lat, lng: jsonData.geometry.location.lng, icon: jsonData.icon, types: jsonData.types },
       function (err, saved)
    {
        
        // Query in MongoDB via Mongo JS Module
    if (err || !saved) res.end("Place not saved");
        else res.end("Place saved");
    });
});

module.exports = router;