import { initSettings } from './settings';
import { initPreview } from './preview';
import { downloadSvg } from './svg-export';
import { createSample, loadImage } from '../utils/image';
import { getElement, formatBytes } from '../utils/dom';
import { TRACE_TIMEOUT_MS } from '../config/constants';
import type { LoadedImage, TraceRequest, TraceResponse } from '../types';

export function initConverter(): void {
  if (!document.querySelector('.js-converter')) return;
  const input = getElement<HTMLInputElement>('.js-file');
  const dropzone = getElement<HTMLElement>('.js-dropzone');
  const status = getElement<HTMLElement>('.js-status');
  const convert = getElement<HTMLButtonElement>('.js-convert');
  const cancel = getElement<HTMLButtonElement>('.js-cancel');
  const save = getElement<HTMLButtonElement>('.js-save');
  const copy = getElement<HTMLButtonElement>('.js-copy');
  const busy = getElement<HTMLElement>('.js-busy');
  const fieldset = getElement<HTMLFieldSetElement>('.js-settings-fields');
  const resultMeta = getElement<HTMLElement>('.js-result-meta');
  const preview = initPreview();
  let image: LoadedImage | null = null;
  let svg = '';
  let worker: Worker | null = null;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let generation = 0;
  let loading = false;
  const settings = initSettings(function () {
    invalidateResult();
    if (image) message('設定を変更しました。「SVGに変換」で反映してください。');
  });

  function message(text: string, error = false): void {
    status.textContent = text;
    status.classList.toggle('is-error', error);
  }
  function controls(): void {
    const working = worker !== null;
    convert.disabled = !image || working || loading;
    cancel.hidden = !working;
    busy.hidden = !working && !loading;
    fieldset.disabled = working || loading;
    save.disabled = !svg || working || loading;
    copy.disabled = save.disabled;
    getElement<HTMLElement>('.js-preview').setAttribute('aria-busy', String(working || loading));
  }
  function stop(): void {
    worker?.terminate();
    worker = null;
    clearTimeout(timeout);
    controls();
  }
  function invalidateResult(): void {
    svg = '';
    preview.clearResult();
    resultMeta.textContent = '変換するとサイズを表示';
    controls();
  }
  async function accept(file: File): Promise<void> {
    const token = ++generation;
    stop();
    loading = true;
    invalidateResult();
    message('画像を読み込んでいます…');
    try {
      const next = await loadImage(file);
      if (token !== generation) { URL.revokeObjectURL(next.previewUrl); return; }
      if (image) URL.revokeObjectURL(image.previewUrl);
      image = next;
      preview.setOriginal(next.previewUrl, next.width, next.height);
      getElement<HTMLElement>('.js-file-name').textContent = next.name;
      getElement<HTMLElement>('.js-file-meta').textContent = `${next.originalWidth} × ${next.originalHeight} px / ${formatBytes(next.sourceBytes)}`;
      getElement<HTMLElement>('.js-source-meta').textContent = `${next.originalWidth} × ${next.originalHeight} px`;
      getElement<HTMLElement>('.js-trace-size').textContent = `出力：${next.width} × ${next.height} px`;
      message(next.width !== next.originalWidth || next.height !== next.originalHeight
        ? `処理用に ${next.width} × ${next.height} pxへ縮小しました。設定を選んで変換してください。`
        : '画像を読み込みました。設定を選んで変換してください。');
    } catch (error) {
      if (token === generation) message(error instanceof Error ? error.message : '画像を読み込めませんでした。', true);
    } finally {
      if (token === generation) { loading = false; controls(); }
    }
  }
  function acceptFiles(files: FileList | null): void {
    if (!files?.length) return;
    if (files.length !== 1) { message('画像は1枚ずつ選んでください。', true); return; }
    void accept(files[0]);
  }
  input.addEventListener('change', function () { acceptFiles(input.files); input.value = ''; });
  getElement<HTMLButtonElement>('.js-choose').addEventListener('click', () => input.click());
  getElement<HTMLButtonElement>('.js-sample').addEventListener('click', async function () {
    try { await accept(await createSample()); }
    catch { message('サンプルを読み込めませんでした。画像を選んでください。', true); }
  });
  for (const name of ['dragenter', 'dragover']) dropzone.addEventListener(name, function (event) {
    event.preventDefault(); dropzone.classList.add('is-dragging');
  });
  dropzone.addEventListener('dragleave', function (event) {
    if (!dropzone.contains((event as DragEvent).relatedTarget as Node | null)) dropzone.classList.remove('is-dragging');
  });
  dropzone.addEventListener('drop', function (event) {
    event.preventDefault(); dropzone.classList.remove('is-dragging'); acceptFiles(event.dataTransfer?.files ?? null);
  });
  window.addEventListener('dragover', event => event.preventDefault());
  window.addEventListener('drop', event => event.preventDefault());
  cancel.addEventListener('click', function () { ++generation; stop(); message('変換をキャンセルしました。設定を変えて再実行できます。'); });
  convert.addEventListener('click', function () {
    if (!image || worker || loading) return;
    invalidateResult();
    const token = ++generation;
    try {
      worker = new Worker(new URL('../workers/tracer.worker.ts', import.meta.url), { type: 'module' });
      controls();
      message('変換エンジンを読み込んでいます…');
      timeout = setTimeout(function () {
        if (token !== generation) return;
        ++generation; stop(); message('処理に時間がかかっています。画像を小さくして再実行してください。', true);
      }, TRACE_TIMEOUT_MS);
      worker.onerror = function () {
        if (token !== generation) return;
        stop(); message('変換を実行できませんでした。再実行するか、画像を小さくしてください。', true);
      };
      worker.onmessage = async function (event: MessageEvent<TraceResponse>) {
        if (token !== generation) return;
        const result = event.data;
        if (result.type === 'stage') {
          message(result.stage === 'loading' ? '変換エンジンを読み込んでいます…' : 'SVGに変換しています…');
        } else if (result.type === 'error') {
          stop(); message('変換できませんでした。設定をリセットするか、別の画像でお試しください。', true);
        } else {
          try {
            await preview.setResult(result.svg);
            if (token !== generation) return;
            svg = result.svg;
            const bytes = new Blob([svg]).size;
            resultMeta.textContent = `${formatBytes(bytes)} / ${(result.elapsed / 1000).toFixed(2)} 秒`;
            message(bytes > (image?.sourceBytes ?? 0) ? '変換が完了しました。SVGは元画像よりファイルサイズが大きくなっています。' : '変換が完了しました。プレビューを確認して保存できます。');
            stop();
          } catch {
            if (token !== generation) return;
            stop(); message('SVGを表示できませんでした。設定を変えて再実行してください。', true);
          }
        }
      };
      const pixels = image.pixels.slice().buffer;
      const request: TraceRequest = { pixels, width: image.width, height: image.height, settings: settings.read() };
      worker.postMessage(request, [pixels]);
    } catch {
      stop(); message('このブラウザでは変換を開始できません。最新のブラウザでお試しください。', true);
    }
  });
  save.addEventListener('click', function () { if (svg && image) downloadSvg(svg, image.name); });
  copy.addEventListener('click', async function () {
    if (!svg) return;
    try { await navigator.clipboard.writeText(svg); message('SVGコードをコピーしました。'); }
    catch { message('コピーが許可されていません。SVGを保存してご利用ください。', true); }
  });
  controls();
}
