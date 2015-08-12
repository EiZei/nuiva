'use strict';

var rewire = require('rewire');
var Q = require('q');

describe('Text generation', function() {
    var textGeneration;
    var mockDao;
    var instantDeferred;
    beforeEach(function() {
        textGeneration = rewire('../components/text_generation');
        mockDao = {};
        textGeneration.__set__('dao', mockDao);
    });
    describe('when given a random beginning subject word', function() {
        var beginWord = 'first';
        var mockNextWords = function(nextWords) {
            mockDao.nextSubjectWords = function(word) {
                if (nextWords[word]) {
                    return Q(nextWords[word]);
                } else {
                    throw 'not expected';
                }
            }
        };
        beforeEach( function() {
            mockDao.randomBeginSubjectWord = function() {
                return Q(beginWord);
            };
        });
        describe('and no follow-up words', function() {
            beforeEach(function() {
                var mockNext = {};
                mockNext[beginWord] = [{value:  null, weight: 1}];
                mockNextWords(mockNext);
            });
            it('should result in a single word subject', function(done) {
                textGeneration.subject().then(function (result) {
                    expect(result).toEqual(beginWord);
                    done();
                });
            });
        });
        describe('and a follow-up word', function() {
            var followUpWord = 'second';
            beforeEach(function() {
                var mockNext = {};
                mockNext[beginWord] = [{value:  followUpWord, weight: 1}];
                mockNext[followUpWord] = [{value:  null, weight: 1}];
                mockNextWords(mockNext) ;
            });
            it('should return the two words as a single string', function(done) {
                textGeneration.subject().then(function(result) {
                    expect(result).toEqual(beginWord + ' ' + followUpWord);
                    done();
                });
            })
        });
        describe('and two equally likely follow-up words', function() {
            var firstFollow = 'second';
            var secondFollow = 'third';
            beforeEach(function() {
                var mockNext = {};
                mockNext[beginWord] = [{value:  firstFollow, weight: 1}, {value: secondFollow, weight: 1}];
                mockNext[firstFollow] = [{value:  null, weight: 1}];
                mockNext[secondFollow] = [{value:  null, weight: 1}];
                mockNextWords(mockNext) ;
            });
            it('should produce subjects with both words', function(done) {
                var allPromises = [];
                var iterations = 1000;
                for (var i = 0; i < iterations; i++) {
                    allPromises.push(textGeneration.subject());
                };
                Q.all(allPromises).then(function(subjects) {
                    var firsts = 0, seconds = 0;
                    for (var i = 0; i < subjects.length; i++) {
                        if (subjects[i] === beginWord + ' ' + firstFollow) {
                            firsts += 1;
                        } else if(subjects[i] === beginWord + ' ' + secondFollow) {
                            seconds += 1;
                        }
                    }
                    expect(firsts).toBeGreaterThan(iterations * 0.4);
                    expect(seconds).toBeGreaterThan(iterations * 0.4);
                    expect(firsts + seconds).toEqual(iterations);
                    done();
                });
            });
        });
    });
});