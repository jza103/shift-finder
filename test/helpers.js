// Shared helpers for the parser tests. The parser lives inside index.html (one self-contained page), so the
// tests pull its <script> block out and run it, exactly as the browser does.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

// PARSER_HTML=path/to/old/index.html npm test runs the tests against another version (to see what a change broke).
function loadParser(htmlPath = process.env.PARSER_HTML || path.join(ROOT, 'index.html')) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const m = html.match(/<script>\s*(\/\/ BQT schedule parser[\s\S]*?)<\/script>/);
  if (!m) throw new Error('Parser script not found in index.html');
  const mod = { exports: {} };
  new Function('module', m[1])(mod);
  return mod.exports;
}

// A fixture is { name, pages: [{ items: [{ str, transform, width }], lines: [{ dir, at, from, to, thick }] }] }:
// what pdf.js getTextContent and linesFromOps give for each page, with names anonymised.
function loadFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', `${name}.json`), 'utf8'));
}

// Every shift for every person, one line each, plus the give-away list: the full output a user can see.
function summarize(api, pages) {
  const doc = api.parseDocument(pages);
  const out = [];
  for (const p of doc.people) {
    for (const e of api.scheduleFor(doc, p.key)) {
      for (const s of e.shifts) {
        const g = api.giveAwayFor(e.day, s, p.key);
        out.push([
          e.day.date, p.section, p.name, `col${s.column}`, s.functionName, api.formatTime(s.time), s.location,
          s.guests, s.uniform, s.managers.join('+'), s.warnings.join(' / '),
          g.availKnown ? 'avail' : 'no-avail', g.candidates.map((c) => c.name + (c.prefersOff ? '/' : '')).join(','),
        ].join(' | '));
      }
      if (e.notes.length) out.push(`${e.day.date} | ${p.section} | ${p.name} | notes | ${e.notes.join(' ; ')}`);
    }
  }
  return out;
}

// The same page drawn bigger or smaller: an export at a different zoom or paper size.
function scalePages(pages, f, thickF = f) {
  return pages.map((p) => ({
    items: p.items.map((i) => ({ ...i, width: i.width * f, transform: i.transform.map((v) => v * f) })),
    lines: p.lines.map((l) => ({ ...l, at: l.at * f, from: l.from * f, to: l.to * f, thick: l.thick * thickF })),
  }));
}

// Only the borders thicker or thinner (cell shading, the thick candidates, stays as it is).
function thickenBorders(pages, t) {
  return pages.map((p) => ({ items: p.items, lines: p.lines.map((l) => (l.thick <= 2 ? { ...l, thick: l.thick * t } : l)) }));
}

module.exports = { ROOT, loadParser, loadFixture, summarize, scalePages, thickenBorders };
