import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initialize, vectorize_rgba } from '../src/js/vendor/vtracer/vtracer_wasm.js';

const bytes = await readFile(new URL('../src/js/vendor/vtracer/vtracer_wasm_bg.wasm', import.meta.url));
await initialize(`data:application/wasm;base64,${bytes.toString('base64')}`);
const pixels = new Uint8Array(32 * 32 * 4);
for (let y = 8; y < 24; y++) {
  for (let x = 8; x < 24; x++) pixels.set([255, 0, 0, 255], (y * 32 + x) * 4);
}

for (const mode of ['spline', 'polygon', 'pixel']) {
  test(`${mode}: browser-adapted Wasm emits real vector paths`, function () {
    const svg = vectorize_rgba(pixels, 32, 32, { mode, filterSpeckle: 0 });
    assert.match(svg, /<svg\b/);
    assert.match(svg, /<path\b/);
    assert.match(svg, /width="32"/);
    assert.match(svg, /height="32"/);
    assert.doesNotMatch(svg, /<image\b|data:image/);
  });
}
test('binary tracing emits vector paths', function () {
  const opaque = new Uint8Array(32 * 32 * 4).fill(255);
  for (let y = 8; y < 24; y++) {
    for (let x = 8; x < 24; x++) opaque.set([0, 0, 0, 255], (y * 32 + x) * 4);
  }
  assert.match(vectorize_rgba(opaque, 32, 32, { clustering: 'bw' }), /<path\b/);
});
test('invalid dimensions fail rather than returning corrupt SVG', function () {
  assert.throws(() => vectorize_rgba(new Uint8Array(3), 32, 32, {}));
});
