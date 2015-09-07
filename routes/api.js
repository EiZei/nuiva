'use strict';

var express = require('express');
var router = express.Router();
var TextGeneration = require('../components/text-generation');
var textGeneration = new TextGeneration();

router.get('/subject/', function (req, res, next) {
    textGeneration.subject().done(function (subject) {
        res.json({result: subject});
    }, next);
});

router.get('/paragraph/', function (req, res, next) {
    textGeneration.paragraph().done(function (paragraph) {
        res.json({result: paragraph});
    }, next);
});

module.exports = router;
