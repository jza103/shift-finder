// Builds a test fixture from a schedule PDF: the text items and drawn border lines of each page, with every
// person's name and every event location replaced, so a real schedule can be checked in without anyone's
// details. Positions and widths are kept exactly, so the layout reads the same.
//
//   npm install            (once; pdfjs-dist is only needed here)
//   node test/tools/make-fixture.js <schedule.pdf> <fixture-name> [--keep Name,Name]
//   UPDATE=1 npm test      (then review and commit the new .expected.json)
//
// Names listed with --keep stay as they are (only first names already used in the README or tests).
const fs = require('node:fs');
const path = require('node:path');
const { loadParser } = require('../helpers');

async function main() {
  const [pdfPath, name, ...rest] = process.argv.slice(2);
  if (!pdfPath || !name) { console.error('Usage: node test/tools/make-fixture.js <schedule.pdf> <fixture-name> [--keep Name,Name]'); process.exit(1); }
  const keepAt = rest.indexOf('--keep');
  const keep = new Set(keepAt >= 0 ? rest[keepAt + 1].split(',') : []);
  const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
  const api = loadParser();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(pdfPath)), verbosity: 0 }).promise;
  const pages = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const items = (await page.getTextContent()).items.filter((i) => i.str && i.str.trim());
    pages.push({ items, lines: api.linesFromOps(await page.getOperatorList(), pdfjs.OPS) });
  }

  // Who and where, as the parser reads them.
  const parsed = api.parseDocument(pages);
  const people = new Map(), places = new Map();
  for (const d of parsed.days) for (const p of d.people) {
    if (!keep.has(p.name) && !people.has(p.name)) people.set(p.name, `Person ${String(people.size + 1).padStart(3, '0')}`);
    for (const c of Object.values(d.cols)) for (const l of c.labels) {
      if (!/^(AM|PM)\b/i.test(l) && !places.has(l)) places.set(l, `Venue ${String(places.size + 1).padStart(2, '0')}`);
    }
  }
  const norm = (s) => s.trim().replace(/\s+/g, ' ');
  const r2 = (v) => Math.round(v * 100) / 100;
  let replaced = 0;
  const out = pages.map((p) => ({
    items: p.items.map((i) => {
      const s = norm(i.str);
      const swap = people.get(s) || places.get(s);
      if (swap) replaced++;
      return { str: swap || i.str, transform: Array.from(i.transform, r2), width: r2(i.width) };
    }),
    lines: p.lines.map((l) => ({ dir: l.dir, at: r2(l.at), from: r2(l.from), to: r2(l.to), thick: r2(l.thick) })),
  }));
  // Anything left that still contains a replaced name (a note like "w/ Name") is reported for a manual look.
  const left = out.flatMap((p) => p.items.map((i) => i.str)).filter((s) => [...people.keys()].some((n) => n.length > 2 && s.includes(n) && !people.has(norm(s))));
  if (left.length) console.warn('Still contains a real name, check these:', [...new Set(left)]);
  const file = path.join(__dirname, '..', 'fixtures', `${name}.json`);
  fs.writeFileSync(file, JSON.stringify({ name, source: path.basename(pdfPath), pages: out }));
  console.log(`Wrote ${file}: ${out.length} pages, ${people.size} names and ${places.size} locations replaced (${replaced} text items).`);
}
main().catch((e) => { console.error(e); process.exit(1); });
