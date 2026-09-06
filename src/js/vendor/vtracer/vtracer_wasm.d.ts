import type { Options } from '@visioncortex/vtracer';
export function initialize(url: string): Promise<void>;
export function vectorize_rgba(data: Uint8Array, width: number, height: number, options: Options): string;
export function vectorize_bytes(data: Uint8Array, options: Options): string;
