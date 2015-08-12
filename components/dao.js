'use strict';

var Q = require('q');
var sqlite3 = require('sqlite3');

module.exports = {
    nextSubjectWords: nextSubjectWords,
    nextParagraphWord: nextParagraphWord,
    randomBeginSubjectWord: randomBeginSubjectWord,
    randomBeginParagraphWords: randomParagraphBeginWords
};

var db = function () {
    return new sqlite3.Database('nuiva.db');
};
function nextSubjectWords(word) {
    var deferred = Q.defer();
    db().all('SELECT next AS value, count AS weight FROM subject WHERE word = ?', [word], function (err, rows) {
        if (err) {
            deferred.reject(err);
        }

        deferred.resolve(rows);
    });

    return deferred.promise;
}
function nextParagraphWord(first, second) {
    var deferred = Q.defer();
    db().all('SELECT next AS value, count AS weight FROM paragraph WHERE word_1 = ? AND word_2 = ?', [first, second], function (err, rows) {
        if (err) {
            deferred.reject(err);
        }

        deferred.resolve(rows);
    });

    return deferred.promise;
}
function randomBeginSubjectWord() {
    var deferred = Q.defer();
    db().get('SELECT word FROM first_subject_word ORDER BY RANDOM() LIMIT 1', [], function (err, row) {
        if (err) {
            deferred.reject(err);
        }

        deferred.resolve(row['word']);
    });

    return deferred.promise;
}
function randomParagraphBeginWords() {
    var deferred = Q.defer();
    db().get('SELECT word_1, word_2 FROM first_paragraph_word ORDER BY RANDOM() LIMIT 1', [], function (err, row) {
        if (err) {
            deferred.reject(err);
        }

        deferred.resolve([row['word_1'], row['word_2']]);
    });

    return deferred.promise;
}
