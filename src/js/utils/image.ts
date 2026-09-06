import { MAX_FILE_BYTES, MAX_INPUT_PIXELS, MAX_TRACE_EDGE, MAX_TRACE_PIXELS } from '../config/constants';
import type { LoadedImage } from '../types';

export async function loadImage(file: File): Promise<LoadedImage> {
  if (!file.size || file.size > MAX_FILE_BYTES) throw new Error('20 MB以下の画像を選んでください。');
  const signature = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const png = signature[0] === 137 && signature[1] === 80 && signature[2] === 78 && signature[3] === 71;
  const jpeg = signature[0] === 255 && signature[1] === 216 && signature[2] === 255;
  const webp = new TextDecoder().decode(signature).startsWith('RIFF') && new TextDecoder().decode(signature.slice(8)) === 'WEBP';
  if (!png && !jpeg && !webp) throw new Error('PNG・JPEG・WebPの画像を選んでください。');
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { throw new Error('画像を読み込めません。別の画像でお試しください。'); }
  try {
    if (bitmap.width * bitmap.height > MAX_INPUT_PIXELS) throw new Error('画像が大きすぎます。2400万画素以下に縮小してください。');
    const ratio = Math.min(1, MAX_TRACE_EDGE / Math.max(bitmap.width, bitmap.height), Math.sqrt(MAX_TRACE_PIXELS / (bitmap.width * bitmap.height)));
    const width = Math.max(1, Math.round(bitmap.width * ratio));
    const height = Math.max(1, Math.round(bitmap.height * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('このブラウザでは画像を処理できません。');
    context.drawImage(bitmap, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    // VTracer traces solid regions: preserve fully transparent pixels, composite partial alpha onto white.
    for (let index = 0; index < pixels.length; index += 4) {
      const alpha = pixels[index + 3] / 255;
      if (alpha > 0 && alpha < 1) {
        for (let channel = 0; channel < 3; channel++) pixels[index + channel] = Math.round(pixels[index + channel] * alpha + 255 * (1 - alpha));
        pixels[index + 3] = 255;
      }
    }
    return { name: file.name, width, height, originalWidth: bitmap.width, originalHeight: bitmap.height,
      sourceBytes: file.size, pixels, previewUrl: URL.createObjectURL(file) };
  } finally { bitmap.close(); }
}

export async function createSample(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('サンプルを作成できません。');
  context.fillStyle = '#edf2ff';
  context.fillRect(0, 0, 640, 480);
  context.fillStyle = '#4169e1';
  context.beginPath(); context.arc(320, 225, 150, 0, Math.PI * 2); context.fill();
  context.fillStyle = '#b6e4dc';
  context.beginPath(); context.moveTo(170, 355); context.lineTo(320, 110); context.lineTo(470, 355); context.closePath(); context.fill();
  context.fillStyle = '#1c3257';
  context.beginPath(); context.arc(320, 290, 58, 0, Math.PI * 2); context.fill();
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('サンプルを作成できません。')), 'image/png'));
  return new File([blob], 'sample.png', { type: 'image/png' });
}
