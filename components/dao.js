'use strict';

var Q = require('q');
var pg = require('pg');

module.exports = function getDao(seed) {
    var daoDeferred = Q.defer();
    var client;
    var doneCallBack;

    var dao = {
        nextSubjectWords: nextSubjectWords,
        nextParagraphWord: nextParagraphWord,
        randomBeginSubjectWord: randomBeginSubjectWord,
        randomBeginParagraphWords: randomParagraphBeginWords,
        done: done
    };

    pg.connect('/var/run/postgresql', function (err, c, done) {
        if (err) {
            daoDeferred.reject(err);
        } else {
            client = c;
            doneCallBack = done;
            if (seed) {
                client.query('SELECT setseed($1)', [seed], function (err) {
                    if (err) {
                        daoDeferred.reject(err);
                    } else {
                        daoDeferred.resolve(dao);
                    }
                });
            } else {
                daoDeferred.resolve(dao);
            }
        }
    });

    function genericQuery(sql, params) {
        var deferred = Q.defer();
        client.query(sql, params, function (err, result) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(result);
            }
        });

        return deferred.promise;
    }

    function nextSubjectWords(word) {
        return genericQuery('SELECT next AS value, count AS weight FROM subject WHERE word = $1 ORDER BY word, next, count', [word]).then(function (result) {
            return result.rows;
        });
    }

    function nextParagraphWord(first, second) {
        return genericQuery('SELECT next AS value, count AS weight FROM paragraph WHERE word_1 = $1 AND word_2 = $2 ORDER BY word_1, word_2, next, count', [first, second]).then(function (result) {
            return result.rows;
        });
    }

    function randomBeginSubjectWord() {
        return genericQuery('SELECT word FROM first_subject_word ORDER BY RANDOM() LIMIT 1', [], seed).then(function (result) {
            return result.rows[0]['word'];
        });
    }

    function randomParagraphBeginWords() {
        return genericQuery('SELECT word_1, word_2 FROM first_paragraph_word ORDER BY RANDOM() LIMIT 1', [], seed).then(function (result) {
            return [result.rows[0]['word_1'], result.rows[0]['word_2']];
        });
    }

    function done() {
        if (doneCallBack) {
            doneCallBack();
            doneCallBack = undefined;
        }
    }

    return daoDeferred.promise;
}
;