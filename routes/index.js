var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', { title: 'Express' });
});

router.get('/api/flags', function (req, res) {
    res.json(  [ { "id": 1, "name": "Koen" },
                { "id": 2, "name": "Stéphanie" } ])
});

module.exports = router;