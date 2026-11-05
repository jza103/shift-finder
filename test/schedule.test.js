// End-to-end checks on a real weekly schedule (WE 11/13/2026, names and locations anonymised).
// The snapshot covers everything a user sees; the named tests pin down the bugs we've already fixed.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadParser, loadFixture, summarize } = require('./helpers');

const api = loadParser();
const fx = loadFixture('we-2026-11-13');
const doc = api.parseDocument(fx.pages);
const wed = doc.days.find((d) => d.date === '2026-11-11');

test('the full week matches the reviewed snapshot', () => {
  // When a change is meant to alter the output: UPDATE=1 npm test, then review the diff of the .expected.json.
  const file = path.join(__dirname, 'fixtures', 'we-2026-11-13.expected.json');
  const actual = summarize(api, fx.pages);
  if (process.env.UPDATE) fs.writeFileSync(file, JSON.stringify(actual, null, 1) + '\n');
  assert.deepEqual(actual, JSON.parse(fs.readFileSync(file, 'utf8')));
});

test('reads all 7 days and every name', () => {
  assert.deepEqual(doc.errors, []);
  assert.deepEqual(doc.days.map((d) => d.weekday), ['SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']);
  assert.deepEqual(doc.days.map((d) => d.date), ['2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13']);
  assert.equal(doc.people.length, 91);
});

test("Vanessa's Wednesday lunch is 10:00a, not 10:30a from the column next to it", () => {
  // The bug: this export's columns are 24.6 pt apart, not ~35, and a grid built on a 35.2 pt guess merged
  // the 10:30a lunch (col 8) and the 10a lunch (col 9) into one column, showing "1030a 10a".
  const v = doc.people.find((p) => p.name === 'Vanessa');
  const day = api.scheduleFor(doc, v.key).find((e) => e.day.date === '2026-11-11');
  assert.deepEqual(day.shifts.map((s) => [s.column, s.functionName, api.formatTime(s.time), s.guests, s.location, s.warnings]), [
    [9, 'Lunch', '10:00a', '275', 'Venue 24', []],
    [13, 'Dinner', '4:00p', '255', 'Venue 34', []],
  ]);
});

test('every column holds exactly one event: one function, one in-time, one guest count, one location', () => {
  for (const d of doc.days) {
    for (const c of Object.values(d.cols)) {
      const where = `${d.weekday} col ${c.index}`;
      assert.equal(c.func.split(' ').length, 1, `${where} function "${c.func}"`);
      assert.equal(c.intime.split(' ').length, 1, `${where} in-time "${c.intime}"`);
      if (c.guests) assert.equal(c.guests.split(' ').length, 1, `${where} guests "${c.guests}"`);
      assert.equal(c.labels.length, 1, `${where} labels ${JSON.stringify(c.labels)}`);
      assert.deepEqual(c.warnings, [], where);
    }
  }
});

test('Wednesday: 15 columns 24.6 pt apart, numbered by slot (col 2 is the blank spacer)', () => {
  assert.ok(Math.abs(wed.pitch - 24.6) < 0.05, `pitch ${wed.pitch}`);
  const cols = Object.values(wed.cols).sort((a, b) => a.index - b.index);
  assert.deepEqual(cols.map((c) => c.index), [0, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
  assert.deepEqual(cols.map((c) => c.func).join(''), 'CBCBBBBBBLLLLLDDD');
  assert.deepEqual(cols.map((c) => c.intime), ['4a', '11a', '5a', '5a', '530a', '530a', '545a', '1030a', '10a', '10a', '1030a', '1030a', '4p', '330p', '5p']);
});

test('every page reads columns, rows and availability from the drawn borders', () => {
  for (const d of doc.days) {
    assert.equal(d.columnSource, 'borders', d.weekday);
    assert.equal(d.rowSource, 'borders', d.weekday);
    assert.equal(d.availSource, 'borders', d.weekday);
    assert.ok(d.availKnown, d.weekday);
  }
});

test("availability: only X and / count; Vanessa is out for AM on Wednesday", () => {
  const v = wed.people.find((p) => p.name === 'Vanessa');
  assert.deepEqual(v.avail, ['X', '', '']);
  for (const d of doc.days) for (const p of d.people) for (const a of p.avail) assert.match(a, /^([X/]( [X/])*)?$/, `${d.weekday} ${p.name}`);
});

test('calendar export: one event per shift, IDs built from date, name and column', () => {
  const v = doc.people.find((p) => p.name === 'Vanessa');
  const ics = api.icsFor('Vanessa', api.scheduleFor(doc, v.key));
  assert.equal(ics.count, 4);
  const uids = ics.text.match(/^UID:.*$/gm);
  assert.deepEqual(uids, [
    'UID:2026-11-09-vanessa-col16@bqt-shift-finder',
    'UID:2026-11-10-vanessa-col21@bqt-shift-finder',
    'UID:2026-11-11-vanessa-col9@bqt-shift-finder',
    'UID:2026-11-11-vanessa-col13@bqt-shift-finder',
  ]);
  assert.match(ics.text, /DTSTART;TZID=America\/Phoenix:20261111T100000/);
});
