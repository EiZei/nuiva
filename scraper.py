from bs4 import BeautifulSoup
from pprint import pprint
import requests
import random
import sqlite3

conn = sqlite3.connect('nuiva.db')

def weighted_choose(choices):
    total_weight = sum(weight for _, weight in choices)
    r = random.uniform(0, total_weight)
    upto = 0
    for choice, weight in choices:
        if upto + weight > r:
            return choice
        upto += weight
    raise Exception('shouldnt happen')


def scrape_board(board_id):
    board_page = BeautifulSoup(requests.get('http://hommaforum.org/index.php/board,{}.0.html'.format(board_id)).text)
    max_offset = max([int(a.get('href').split('.')[-2]) for a in board_page.findAll('a', class_='navPages')])
    offset = 0
    while offset <= max_offset:
        scrape_board_page(board_id, offset)
        offset += 30

def make_subject(word=None, so_far=None):
    if not so_far:
        so_far = []
    if not word:
        word = random.sample(begin_subject_words, 1)[0]
    next_word = weighted_choose(subjects[word].items())
    if next_word:
        so_far.append(next_word)
        return make_subject(next_word, so_far)
    else:
        return ' '.join(so_far)

def make_paragraph(so_far=None):
    if not so_far:
        so_far = list(random.sample(begin_paragraph_words, 1)[0])
    key = (so_far[-2], so_far[-1])
    next_word = weighted_choose(paragraphs[key].items())
    if next_word:
        so_far.append(next_word)
        return make_paragraph(so_far)
    else:
        return ' '.join(so_far)

def scrape_board_page(board_id, offset):
    doc = BeautifulSoup(requests.get('http://hommaforum.org/index.php/board,{}.{}.html'.format(board_id, offset)).text)
    elem_to_thread_id = lambda elem: int(elem.find('a').get('href').split('.')[-3].split(',')[-1])
    threads = [(elem_to_thread_id(elem), elem.find('a').text) for elem in doc.findAll('td', class_='subject')]
    for thread_id, subject in threads:
        if conn.execute('SELECT COUNT(*) FROM processed_threads WHERE thread_id = ?''', (thread_id,)).next()[0] > 0:
	    print 'skipping thread {}, already processed'.format(thread_id)
	    continue
    	print 'scraping thread {}'.format(thread_id)
        process_subject(subject)
        scrape_thread(thread_id)

    

def process_subject(subject):
    parts = [part.lower() for part in subject.split()]
    if len(parts) < 2:
        return
    conn.execute('''INSERT OR IGNORE INTO first_subject_word VALUES (?)''', (parts[0],))
    for i in xrange(len(parts)):
        first, second = (parts[i], parts[i+1] if i < (len(parts) - 1) else None)
        conn.execute('''INSERT OR IGNORE into subject VALUES (?, ?, 0)''', (first, second))
        conn.execute('''UPDATE subject SET count = count + 1 WHERE word = ? AND next = ?''', (first, second))

    
def scrape_thread(thread_id):
    doc = BeautifulSoup(requests.get('http://hommaforum.org/index.php?action=printpage;topic={}.0'.format(thread_id)).text)
    all_contents = [elem.contents for elem in doc.findAll('dd', class_='postbody')]
    for contents in all_contents:
        paragraphs = [content for content in contents if isinstance(content, basestring)]
        for paragraph in paragraphs:
            process_paragraph(paragraph)
    conn.execute('INSERT INTO processed_threads VALUES (?)', (thread_id,))
    conn.commit()


def process_paragraph(paragraph):
    parts = [part.lower() for part in paragraph.split()]
    if len(parts) < 3:
        return
    conn.execute('''INSERT OR IGNORE INTO first_paragraph_word VALUES (?, ?)''', (parts[0], parts[1]))
    for i in xrange(len(parts) - 1):
        key = (parts[i], parts[i+1])
        next_word = parts[i+2] if i < (len(parts) - 2) else None
        print u'{}, {} -> {}'.format(key[0], key[1], next_word)
        conn.execute('''INSERT OR IGNORE into paragraph VALUES (?, ?, ?, 0)''', (key[0], key[1], next_word))
        conn.execute('''UPDATE paragraph SET count = count + 1 WHERE word_1 = ? AND word_2 = ? AND next = ?''', (key[0], key[1], next_word))
