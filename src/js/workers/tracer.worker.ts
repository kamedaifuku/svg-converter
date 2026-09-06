import { initialize, vectorize_rgba } from '../vendor/vtracer/vtracer_wasm.js';
import wasmUrl from '../vendor/vtracer/vtracer_wasm_bg.wasm?url';
import type { TraceRequest, TraceResponse } from '../types';

function send(message: TraceResponse): void { self.postMessage(message); }
self.onmessage = async function (event: MessageEvent<TraceRequest>): Promise<void> {
  try {
    send({ type: 'stage', stage: 'loading' });
    await initialize(wasmUrl);
    send({ type: 'stage', stage: 'tracing' });
    const start = performance.now();
    const { pixels, width, height, settings } = event.data;
    const data = new Uint8Array(pixels);
    // Binary tracing treats transparent source pixels as white background.
    if (settings.clustering === 'bw') {
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] === 0) data.fill(255, i, i + 4);
      }
    }
    const svg = vectorize_rgba(data, width, height, { ...settings, hierarchical: 'stacked' });
    send({ type: 'done', svg, elapsed: performance.now() - start });
  } catch (error) {
    send({ type: 'error', message: String(error) });
  }
};
