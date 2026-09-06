import type { PresetName, TraceSettings } from '../types';

const DEFAULT_SETTINGS: TraceSettings = {
  clustering: 'color-cluster', mode: 'spline', colorPrecision: 6,
  filterSpeckle: 4, cornerThreshold: 60, layerDifference: 16,
  lengthThreshold: 4, pathPrecision: 3, binaryThreshold: 128,
};
export const PRESETS: Record<PresetName, TraceSettings> = {
  logo: { ...DEFAULT_SETTINGS, colorPrecision: 5, layerDifference: 32 },
  illustration: { ...DEFAULT_SETTINGS },
  line: { ...DEFAULT_SETTINGS, clustering: 'bw', filterSpeckle: 2 },
  pixel: { ...DEFAULT_SETTINGS, mode: 'pixel', filterSpeckle: 0, layerDifference: 0, colorPrecision: 8 },
};
