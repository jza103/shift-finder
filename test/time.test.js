const test = require('node:test');
const assert = require('node:assert/strict');
const { loadParser } = require('./helpers');

const api = loadParser();
const read = (s, ctx) => { const t = api.readTime(s, ctx); return t && api.formatTime(t); };

test('common in-time spellings', () => {
  assert.equal(read('10a', 'L'), '10:00a');
  assert.equal(read('1030a', 'L'), '10:30a');
  assert.equal(read('530a', 'B'), '5:30a');
  assert.equal(read('4p', 'D'), '4:00p');
  assert.equal(read('12n', 'L'), '12:00p');
  assert.equal(read('10:15a', 'L'), '10:15a');
});

test('a.m./p.m. left off is assumed from the event type', () => {
  assert.equal(read('6', 'B'), '6:00a');
  assert.equal(read('530', 'D'), '5:30p');
  assert.equal(read('1030', 'L'), '10:30a');
  assert.equal(read('2', 'PM'), '2:00p');
  assert.ok(api.parseTime('6', 'B').assumed);
});

test('letters after the time (B for bartender) are kept, not flagged', () => {
  const t = api.readTime('4pB', 'BAR');
  assert.equal(api.formatTime(t), '4:00p');
  assert.equal(t.extra, 'B');
  assert.equal(t.choices, undefined);
});

test('several times in one cell: the earliest wins, and all are listed', () => {
  for (const s of ['1030a 10a', '10a/1030a', '1030 10']) {
    const t = api.readTime(s, 'L');
    assert.equal(api.formatTime(t), '10:00a', s);
    assert.deepEqual(t.choices.map(api.formatTime), ['10:00a', '10:30a'], s);
  }
  assert.equal(read('12n 1030a', 'L'), '10:30a');
  assert.equal(read('10a-2p', 'L'), '10:00a');
  assert.equal(api.readTime('530a 530a', 'B').choices, null); // the same time twice isn't a choice
});

test('typo-looking times are read and marked uncertain', () => {
  const t = api.parseTime('63a', 'B');
  assert.equal(api.formatTime(t), '6:30a');
  assert.ok(t.uncertain);
  assert.equal(api.readTime('soon', 'L'), null);
});
