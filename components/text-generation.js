'use strict';

var Q = require('q');
var LRU = require('lru-cache');
var dao = require('./dao');
var _ = require('lodash');


module.exports = {
    subject: subject,
    paragraph: paragraph
};

var paragraphCache = new LRU(1000);

var weightedRandomSample = function (choices) {
    var weightSum = _.sum(_.map(choices, 'weight'));
    if (weightSum <= 0) {
        throw 'sum of weights must be a positive number';
    }
    var random = _.random(1, weightSum);
    var n = 0;
    for (var i = 0; i < choices.length; i++) {
        var choice = choices[i];
        n += choice.weight;
        if (n >= random) {
            return choice.value;
        }
    }
    throw 'should not happen';
};

function subject() {
    var appendWords = function (soFar) {
        var previousWord = soFar[soFar.length - 1];
        var promise = dao.nextSubjectWords(previousWord);
        return promise.then(function (nextWords) {
            if (nextWords.length === 0) {
                throw 'no next words for ' + previousWord;
            }
            var nextWord = weightedRandomSample(nextWords);
            if (nextWord) {
                soFar.push(nextWord);
                return appendWords(soFar);
            } else {
                return soFar.join(' ');
            }
        });
    };

    return dao.randomBeginSubjectWord().then(function (beginWord) {
        return appendWords([beginWord]);
    });
}

function nextParaghWord(currentWords) {
    var cached = paragraphCache.get(currentWords);
    if (cached) {
        var deferred = Q.defer();
        deferred.resolve(cached);
        return deferred.promise;
    } else {
        return dao.nextParagraphWord(currentWords[0], currentWords[1]).then(function(nextWords) {
            paragraphCache.set(currentWords, nextWords);
            return nextWords;
        });
    }
}

function paragraph() {
    var soFar = [];
    var appendWords = function () {
        var promise = nextParaghWord([soFar[soFar.length - 2], soFar[soFar.length - 1]]);
        return promise.then(function (nextWords) {
            var nextWord = weightedRandomSample(nextWords);
            if (nextWord) {
                soFar.push(nextWord);
                return appendWords(soFar);
            } else {
                return soFar.join(' ');
            }
        });
    };

    return dao.randomBeginParagraphWords().then(function (beginWords) {
        soFar = beginWords.concat([]);
        return appendWords();
    });
}
