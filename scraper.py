import random
import psycopg2
import sys


from bs4 import BeautifulSoup
import requests

conn = psycopg2.connect()
cursor = conn.cursor()


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


def scrape_board_page(board_id, offset):
    doc = BeautifulSoup(requests.get('http://hommaforum.org/index.php/board,{}.{}.html'.format(board_id, offset)).text)
    elem_to_thread_id = lambda elem: int(elem.find('a').get('href').split('.')[-3].split(',')[-1])
    threads = [(elem_to_thread_id(elem), elem.find('a').text) for elem in doc.findAll('td', class_='subject')]
    for thread_id, subject in threads:
        cursor.execute('SELECT COUNT(*) FROM processed_threads WHERE thread_id = %s', (thread_id,))
        if cursor.fetchone()[0] > 0:
            print 'skipping thread {}, already processed'.format(thread_id)
            continue
        print 'scraping thread {}'.format(thread_id)
        process_subject(subject)
        scrape_thread(thread_id)


def process_subject(subject):
    parts = [part.lower() for part in subject.split()]
    if len(parts) < 2:
        return
    cursor.execute('SELECT COUNT(*) FROM first_subject_word WHERE word = %s', (parts[0],))
    if cursor.fetchone()[0] == 0:
        cursor.execute('''INSERT INTO first_subject_word VALUES (%s)''', (parts[0],))
    for i in xrange(len(parts)):
        first, second = (parts[i], parts[i + 1] if i < (len(parts) - 1) else None)
        cursor.execute('SELECT COUNT(*) FROM subject WHERE word = %s AND next = %s', (first, second))
        if cursor.fetchone()[0] == 0:
            cursor.execute('''INSERT INTO subject VALUES (%s, %s, 1)''', (first, second))
        else:
            cursor.execute('''UPDATE subject SET count = count + 1 WHERE word = %s AND next = %s''', (first, second))


def scrape_thread(thread_id):
    doc = BeautifulSoup(
        requests.get('http://hommaforum.org/index.php?action=printpage;topic={}.0'.format(thread_id)).text)
    all_contents = [elem.contents for elem in doc.findAll('dd', class_='postbody')]
    total_paragraph_count = 0
    for contents in all_contents:
        paragraphs = [content for content in contents if isinstance(content, basestring)]
        for paragraph in paragraphs:
            total_paragraph_count += 1
            process_paragraph(paragraph)
    cursor.execute('INSERT INTO processed_threads VALUES (%s)', (thread_id,))
    conn.commit()
    print 'commited {} paragraphs'.format(total_paragraph_count)


def process_paragraph(paragraph):
    parts = [part.lower() for part in paragraph.split()]
    if len(parts) < 3:
        return
    cursor.execute('SELECT COUNT(*) FROM first_paragraph_word WHERE word_1 = %s AND word_2 = %s', (parts[0], parts[1]))
    if cursor.fetchone()[0] == 0:
        cursor.execute('''INSERT INTO first_paragraph_word VALUES (%s, %s)''', (parts[0], parts[1]))
    for i in xrange(len(parts) - 1):
        key = (parts[i], parts[i + 1])
        next_word = parts[i + 2] if i < (len(parts) - 2) else None
        cursor.execute('SELECT COUNT(*) FROM paragraph WHERE word_1 = %s AND word_2 = %s AND next = %s', (key[0], key[1], next_word))
        if cursor.fetchone()[0] == 0:
            cursor.execute('''INSERT INTO paragraph VALUES (%s, %s, %s, 1)''', (key[0], key[1], next_word))
        else:
            cursor.execute('''UPDATE paragraph SET count = count + 1 WHERE word_1 = %s AND word_2 = %s AND next = %s''',
                     (key[0], key[1], next_word))

if __name__ == '__main__':
    board_ids = [int(arg) for arg in sys.argv[1:]]
    if len(board_ids) == 0:
        print 'USAGE: scraper.py <board ids>'
        print 'e.g. python scraper.py 20 10 5'
        sys.exit(0)
    print 'scraping {} board(s), press enter to continue..'.format(len(board_ids))
    raw_input()
    for board_id in board_ids:
        try:
            scrape_board(board_id)
        except KeyboardInterrupt:
            conn.rollback()
            print 'interrupt received, current thread scraping not commited'
    sys.exit(0)