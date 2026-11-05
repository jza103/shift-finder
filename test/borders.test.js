// linesFromOps reads cell borders from a pdf.js operator list. These build small operator lists by hand.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadParser } = require('./helpers');

const api = loadParser();
// Stand-in operator codes: linesFromOps takes the code table as a parameter (pdfjsLib.OPS in the browser).
const OPS = Object.fromEntries(['save', 'restore', 'transform', 'setFillRGBColor', 'setStrokeRGBColor', 'setLineWidth', 'constructPath',
  'endPath', 'fill', 'eoFill', 'stroke', 'closeStroke', 'fillStroke', 'eoFillStroke', 'closeFillStroke', 'closeEOFillStroke',
  'rectangle', 'moveTo', 'lineTo', 'curveTo', 'curveTo2', 'curveTo3', 'closePath', 'eoClip'].map((n, i) => [n, i + 1]));
function ops(...list) {
  const fnArray = [], argsArray = [];
  for (const [name, args] of list) { fnArray.push(OPS[name]); argsArray.push(args ?? null); }
  return { fnArray, argsArray };
}
const rect = (x, y, w, h) => ['constructPath', [[OPS.rectangle], [x, y, w, h]]];
const path = (...pts) => ['constructPath', [[OPS.moveTo, ...pts.slice(1).map(() => OPS.lineTo)], pts.flat()]];
const round = (l) => Object.fromEntries(Object.entries(l).map(([k, v]) => [k, typeof v === 'number' ? Math.round(v * 100) / 100 : v]));

test('thin filled rectangles are borders, with their thickness', () => {
  const lines = api.linesFromOps(ops(['setFillRGBColor', [0, 0, 0]], rect(100, 50, 0.6, 400), ['eoFill'], rect(100, 50, 200, 0.6), ['fill']), OPS);
  assert.deepEqual(lines.map(round), [
    { dir: 'v', at: 100.3, from: 50, to: 450, thick: 0.6 },
    { dir: 'h', at: 50.3, from: 100, to: 300, thick: 0.6 },
  ]);
});

test('white lines, cell fills, curves, diagonals and clip paths are not borders', () => {
  const lines = api.linesFromOps(ops(
    ['setFillRGBColor', [255, 255, 255]], rect(10, 10, 0.6, 100), ['fill'], // white: invisible
    ['setFillRGBColor', '#ffffff'], rect(10, 10, 0.6, 100), ['fill'], // white given as hex
    ['setFillRGBColor', [180, 198, 231]], rect(10, 10, 24.6, 9.8), ['fill'], // a shaded cell
    ['setStrokeRGBColor', [0, 0, 0]], path([0, 0], [50, 50]), ['stroke'], // the slanted header dividers
    ['constructPath', [[OPS.moveTo, OPS.curveTo], [0, 0, 1, 1, 2, 2, 0, 100]]], ['stroke'],
    rect(10, 10, 0.6, 100), ['eoClip'], ['endPath'], // a clip region, never painted
  ), OPS);
  assert.deepEqual(lines, []);
});

test('stroked lines take the pen width, scaled by the drawing transform; save/restore undo it', () => {
  const lines = api.linesFromOps(ops(
    ['setStrokeRGBColor', [0, 0, 0]],
    ['save'], ['transform', [2, 0, 0, 2, 10, 0]], ['setLineWidth', [0.5]], path([5, 5], [5, 105]), ['stroke'], ['restore'],
    path([0, 20], [80, 20]), ['stroke'],
  ), OPS);
  assert.deepEqual(lines.map(round), [
    { dir: 'v', at: 20, from: 10, to: 210, thick: 1 },
    { dir: 'h', at: 20, from: 0, to: 80, thick: 1 },
  ]);
});

test('bordersFrom joins pieces of one line and drops anything too thick for this text size', () => {
  const pieces = [
    { dir: 'v', at: 100, from: 0, to: 50, thick: 0.6 }, { dir: 'v', at: 100.4, from: 50, to: 100, thick: 0.6 },
    { dir: 'h', at: 30, from: 0, to: 200, thick: 9.8 }, // shading, 1.3x the text height: not a border
    { dir: 'h', at: 40, from: 0, to: 200, thick: 2.4 }, // a thick border at 7.56 pt text
  ];
  const b = api.bordersFrom(pieces, 7.56);
  assert.deepEqual(b.v.map(round), [{ at: 100.2, from: 0, to: 100 }]);
  assert.deepEqual(b.h.map(round), [{ at: 40, from: 0, to: 200 }]);
  // At twice the text size the same 9.8 pt shading is still too thick, but 4.8 pt borders now count.
  assert.equal(api.bordersFrom([{ dir: 'h', at: 1, from: 0, to: 200, thick: 4.8 }], 15.12).h.length, 1);
  assert.equal(api.bordersFrom([], 7.56), null);
});
