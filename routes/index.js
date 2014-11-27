var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', { title: 'World Games Server' });
});

router.get('/api/flags', function (req, res) {
    res.json(  [ { "id": 1, "name": "Koen" },
                { "id": 2, "name": "Stéphanie" },
                { "id": 3, "name": "Febe" }
               ])
});

module.exports = router;