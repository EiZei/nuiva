'use strict';

var express = require('express');
var textGeneration = require('../components/text-generation');
var errorHandler = require('../components/error-handler');
var Q = require('q');
var _ = require('lodash');
var router = express.Router();

router.get('/', function (req, res) {
    var postPromises = _.times(_.random(3, 15), function () {
        return Q.all(_.times(_.random(2, 10), textGeneration.paragraph));
    });

    var allPromises = [textGeneration.subject()].concat(postPromises);
    Q.all(allPromises).then(function (resolved) {
        res.render('thread', {
            thread: {
                subject: resolved[0],
                posts: resolved.slice(1)
            }
        });
    }, function (err) {
        errorHandler(err, res);
    });




});

module.exports = router;
