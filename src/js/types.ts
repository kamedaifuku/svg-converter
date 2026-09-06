import type { Options } from '@visioncortex/vtracer';

export type TraceSettings = Required<Pick<Options,
  'clustering' | 'mode' | 'colorPrecision' | 'filterSpeckle' | 'cornerThreshold' |
  'layerDifference' | 'lengthThreshold' | 'pathPrecision' | 'binaryThreshold'
>>;
export type PresetName = 'logo' | 'illustration' | 'line' | 'pixel';
export interface TraceRequest {
  pixels: ArrayBuffer;
  width: number;
  height: number;
  settings: TraceSettings;
}
export type TraceResponse =
  | { type: 'stage'; stage: 'loading' | 'tracing' }
  | { type: 'done'; svg: string; elapsed: number }
  | { type: 'error'; message: string };
export interface LoadedImage {
  name: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  sourceBytes: number;
  pixels: Uint8ClampedArray<ArrayBuffer>;
  previewUrl: string;
}
