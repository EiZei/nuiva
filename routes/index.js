'use strict';

var express = require('express');
var textGeneration = require('../components/text-generation');
var errorHandler = require('../components/error-handler');
var Q = require('q');
var _ = require('lodash');
var router = express.Router();

var randomDate = function() {
  var randomEpoch = new Date() - _.random(0, 30 * 24 * 60 * 60 * 1000);
  return new Date(randomEpoch).toLocaleDateString();
};

router.get('/', function(req, res) {
  var subjectPromises = _.times(20, textGeneration.subject);
  Q.all(subjectPromises).then(function(subjects) {
    var entries = _.map(subjects, function (subject) {
      return {
        subject: subject,
        replies: _.random(1,500),
        previousReply: randomDate()
      };
    });
    res.render('index', { entries: entries });
  }, function(err) {
    errorHandler(err, res);
  });

});

module.exports = router;
