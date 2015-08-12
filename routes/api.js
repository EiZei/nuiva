var express = require('express');
var router = express.Router();
var textGeneration = require('../components/text-generation');
var errorHandler = require('../components/error-handler');

router.get('/subject/', function(req, res) {
  textGeneration.subject().then(function(subject) {
    res.json({ result: subject});
  }, function(err) {
    errorHandler(err, res);
  });
});
router.get('/paragraph/', function(req, res) {
  textGeneration.paragraph().then(function(paragraph) {
    res.json({ result: paragraph});
  }, function(err) {
    errorHandler(err, res);
  });
});

module.exports = router;
