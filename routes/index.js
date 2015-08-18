'use strict';

var express = require('express');
var textGeneration = require('../components/text-generation');
var errorHandler = require('../components/error-handler');
var Q = require('q');
var _ = require('lodash');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  var subjectPromises = _.times(20, textGeneration.subject);
  Q.all(subjectPromises).then(function(subjects) {
    res.render('index', { subjects: subjects });
  }, function(err) {
    errorHandler(err, res);
  });

});

module.exports = router;
