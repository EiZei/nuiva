'use strict';

var Q = require('q');
var pg = require('pg');

module.exports = {
    nextSubjectWords: nextSubjectWords,
    nextParagraphWord: nextParagraphWord,
    randomBeginSubjectWord: randomBeginSubjectWord,
    randomBeginParagraphWords: randomParagraphBeginWords
};

function genericQuery(sql, params) {
    var deferred = Q.defer();
    pg.connect('/var/run/postgresql', function (err, client, done) {
        if (err) {
            deferred.reject(err);
        } else {
            client.query(sql, params, function (err, result) {
                done();
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
        }

    });

    return deferred.promise;

}

function nextSubjectWords(word) {
    return genericQuery('SELECT next AS value, count AS weight FROM subject WHERE word = $1', [word]).then(function (result) {
        return result.rows;
    });
}

function nextParagraphWord(first, second) {
    return genericQuery('SELECT next AS value, count AS weight FROM paragraph WHERE word_1 = $1 AND word_2 = $2', [first, second]).then(function (result) {
        return result.rows;
    });
}
function randomBeginSubjectWord() {
    return genericQuery('SELECT word FROM first_subject_word ORDER BY RANDOM() LIMIT 1', []).then(function (result) {
        return result.rows[0]['word'];
    });
}

function randomParagraphBeginWords() {
    return genericQuery('SELECT word_1, word_2 FROM first_paragraph_word ORDER BY RANDOM() LIMIT 1', []).then(function (result) {
        return [result.rows[0]['word_1'], result.rows[0]['word_2']];
    });
}
