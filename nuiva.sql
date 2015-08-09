CREATE TABLE subject (word NOT NULL, next, count INT NOT NULL, UNIQUE(word, next));
CREATE TABLE paragraph (word_1 NOT NULL, word_2 NOT NULL, next, count INT NOT NULL, UNIQUE(word_1, word_2, next));
CREATE TABLE first_subject_word (word NOT NULL PRIMARY KEY);
CREATE TABLE first_paragraph_word (word_1 NOT NULL, word_2 NOT NULL, PRIMARY KEY(word_1, word_2));
CREATE TABLE processed_threads (thread_id INT PRIMARY KEY);
