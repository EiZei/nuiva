'use strict';

var dao = require('./dao');
var _ = require('lodash');
var Q = require('q');

module.exports = {
    subject: subject,
    paragraph: paragraph
};

var weightedRandomSample = function(choices) {
    var weightSum = _.sum(_.map(choices, 'weight'));
    if (weightSum <= 0) {
        throw 'sum of weights must be a positive number';
    }
    var random = Math.floor(Math.random() * weightSum) + 1;
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
    var words = [];
    var appendWords = function(soFar) {
        var promise =  dao.nextSubjectWords(soFar[soFar.length - 1]);
        return promise.then(function(nextWords) {
            var nextWord = weightedRandomSample(nextWords);
            if (nextWord) {
                soFar.push(nextWord);
                return appendWords(soFar);
            } else {
                return soFar.join(' ');
            }
        });
    };

    return dao.randomBeginSubjectWord().then(function(beginWord) {
        return appendWords([beginWord]);
    });
}
function paragraph() {
    throw 'not implemented';
}
