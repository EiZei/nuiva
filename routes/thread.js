'use strict';

var express = require('express');
var TextGeneration = require('../components/text-generation');
var Q = require('q');
var _ = require('lodash');
var router = express.Router();

var MIN_SEED = 1;
var MAX_SEED = 200000;
var translateSeed = function(from) {
    return -1 + ((from - MIN_SEED)/(MAX_SEED - MIN_SEED) * 2);
};

router.get('/', function (req, res, next) {
    var textGeneration;
    if (req.query.seed) {
        var parsedSeed = _.parseInt(req.query.seed);
        if (parsedSeed > MAX_SEED || parsedSeed < MIN_SEED || isNaN(parsedSeed)) {
            res.status(400).send('invalid seed');
        } else {
            textGeneration = new TextGeneration(translateSeed(parsedSeed));
        }
    } else {
        textGeneration = new TextGeneration();
    }
    var postPromises = _.times(_.random(3, 15), function () {
        return Q.all(_.times(_.random(2, 10), textGeneration.paragraph));
    });

    var allPromises = [textGeneration.subject()].concat(postPromises);
    Q.all(allPromises).done(function (resolved) {
        res.render('thread', {
            thread: {
                subject: resolved[0],
                posts: resolved.slice(1)
            }
        });
        textGeneration.done();
    }, next);
});

module.exports = router;
