// The same schedule, exported or drawn differently, must read the same. Each case changes one thing a
// different export (or a damaged PDF) could change, and compares with the unchanged reading.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadParser, loadFixture, summarize, scalePages, thickenBorders } = require('./helpers');

const api = loadParser();
const fx = loadFixture('we-2026-11-13');
const baseline = summarize(api, fx.pages);
const sources = (pages) => [...new Set(api.parseDocument(pages).days.map((d) => `${d.columnSource}/${d.rowSource}/${d.availSource}`))];
const WED = 4;

for (const f of [0.5, 0.75, 35.2 / 24.6, 2, 3]) {
  test(`page zoomed ${f.toFixed(2)}x reads the same, from the borders`, () => {
    const pages = scalePages(fx.pages, f);
    assert.deepEqual(summarize(api, pages), baseline);
    assert.deepEqual(sources(pages), ['borders/borders/borders']);
  });
}

for (const t of [0.05, 0.5, 2, 3.5]) {
  test(`borders ${(0.6 * t).toFixed(2)} pt thick read the same, from the borders`, () => {
    const pages = thickenBorders(fx.pages, t);
    assert.deepEqual(summarize(api, pages), baseline);
    assert.deepEqual(sources(pages), ['borders/borders/borders']);
  });
}

test('very thick borders (3 pt) are not trusted, and the text alignment reads the same', () => {
  const pages = thickenBorders(fx.pages, 5);
  assert.deepEqual(summarize(api, pages), baseline);
  assert.deepEqual(sources(pages), ['text/text/marks']);
});

test('no borders at all: text alignment reads the same', () => {
  const pages = fx.pages.map((p) => ({ items: p.items, lines: [] }));
  assert.deepEqual(summarize(api, pages), baseline);
  assert.deepEqual(sources(pages), ['text/text/marks']);
  // Pages given as bare text item arrays (no border data) also work.
  assert.deepEqual(summarize(api, fx.pages.map((p) => p.items)), baseline);
});

test('a missing column border (merged header cell) falls back to text alignment for that page', () => {
  const pages = fx.pages.map((p, n) => (n !== WED ? p : { items: p.items, lines: p.lines.filter((l) => !(l.dir === 'v' && Math.abs(l.at - 418.3) < 1)) }));
  assert.deepEqual(summarize(api, pages), baseline);
  assert.equal(api.parseDocument(pages).days[WED].columnSource, 'text');
});

test('borders and text alignment disagreeing about a column puts a check on both columns', () => {
  // Nudge Wednesday's "10a" in-time (col 9) 12 pt right: its border cell is now col 10, its nearest text column 9.
  const pages = fx.pages.map((p, n) => (n !== WED ? p : {
    lines: p.lines,
    items: p.items.map((i) => (i.str === '10a' && Math.abs(i.transform[4] - 425.9) < 0.5 ? { ...i, transform: [...i.transform.slice(0, 4), i.transform[4] + 12, i.transform[5]] } : i)),
  }));
  const day = api.parseDocument(pages).days[WED];
  for (const k of [9, 10]) assert.match(day.cols[k].warnings.join(), /drawn borders and its text alignment disagree/, `col ${k}`);
  assert.deepEqual(day.cols[8].warnings, []);
});

test('availability borders that disagree with the marks leave availability unknown, not wrong', () => {
  const pages = fx.pages.map((p, n) => (n !== WED ? p : { items: p.items, lines: p.lines.map((l) => (l.dir === 'v' && Math.abs(l.at - 170.5) < 1 ? { ...l, at: l.at + 5 } : l)) }));
  const day = api.parseDocument(pages).days[WED];
  assert.equal(day.availSource, 'disputed');
  assert.equal(day.availKnown, false);
  assert.ok(day.people.every((p) => p.avail === null));
});

test('a column header holding two events is flagged, and the earlier time wins', () => {
  // What the old grid bug produced on Wednesday: two lunches in one column.
  const page = { cols: { 6: { index: 6, func: 'L L', guests: '38 275', intime: '1030a 10a', uniform: 'Vest Vest', location: 'Venue 27 / Venue 24', labels: [] } }, people: [] };
  const person = { name: 'Vanessa', prefix: 'PT', section: 'Banquets', cells: { 6: ['L'] } };
  page.people.push(person);
  const [s] = api.shiftsFor(page, person).shifts;
  assert.equal(api.formatTime(s.time), '10:00a');
  assert.equal(s.warnings.length, 2);
  assert.match(s.warnings[0], /more than one time \("1030a 10a"\); showing the earliest, 10:00a/);
  assert.match(s.warnings[1], /looks like two events run together/);
});
