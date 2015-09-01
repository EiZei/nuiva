CREATE TABLE subject (word TEXT NOT NULL, next TEXT NULL, count INT NOT NULL);
CREATE UNIQUE INDEX ON subject(word, next);
CREATE TABLE paragraph (word_1 TEXT NOT NULL, word_2 TEXT NOT NULL, next TEXT NULL, count INT NOT NULL DEFAULT 0);
CREATE UNIQUE INDEX ON paragraph(word_1, word_2, next);
CREATE TABLE first_subject_word (word  TEXT NOT NULL PRIMARY KEY);
CREATE TABLE first_paragraph_word (word_1 TEXT NOT NULL, word_2 TEXT NOT NULL, PRIMARY KEY(word_1, word_2));
CREATE TABLE processed_threads (thread_id INT PRIMARY KEY);
