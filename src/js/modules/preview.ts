import { getElement } from '../utils/dom';

export function initPreview() {
  const original = getElement<HTMLImageElement>('.js-original');
  const result = getElement<HTMLImageElement>('.js-result');
  const stages = [...document.querySelectorAll<HTMLElement>('.js-stage')];
  const planes = [...document.querySelectorAll<HTMLElement>('.js-plane')];
  const zoom = getElement<HTMLSelectElement>('.js-zoom');
  const background = getElement<HTMLSelectElement>('.js-background');
  const preview = getElement<HTMLElement>('.js-preview');
  let dimensions = { width: 640, height: 480 };
  let svgUrl = '';
  let synchronizing = false;

  function resize(): void {
    const visible = stages.find(stage => stage.clientWidth > 0);
    if (!visible) return;
    const availableWidth = Math.max(1, visible.clientWidth - 48);
    const availableHeight = Math.max(1, visible.clientHeight - 48);
    const ratio = zoom.value === 'fit' ? Math.min(availableWidth / dimensions.width, availableHeight / dimensions.height, 1) : Number(zoom.value);
    for (const plane of planes) {
      plane.style.width = `${Math.round(dimensions.width * ratio)}px`;
      plane.style.height = `${Math.round(dimensions.height * ratio)}px`;
    }
  }
  zoom.addEventListener('change', resize);
  background.addEventListener('change', function () { preview.dataset.background = background.value; });
  const tabs = [...document.querySelectorAll<HTMLButtonElement>('.js-preview-tab')];
  for (const tab of tabs) tab.addEventListener('click', function () {
    preview.dataset.view = tab.dataset.view;
    for (const item of tabs) item.setAttribute('aria-pressed', String(item === tab));
    resize();
  });
  for (const stage of stages) stage.addEventListener('scroll', function () {
    if (synchronizing) return;
    synchronizing = true;
    for (const other of stages) if (other !== stage) { other.scrollLeft = stage.scrollLeft; other.scrollTop = stage.scrollTop; }
    requestAnimationFrame(() => { synchronizing = false; });
  }, { passive: true });
  new ResizeObserver(resize).observe(preview);
  function clearResult(): void {
    result.hidden = true;
    result.removeAttribute('src');
    if (svgUrl) URL.revokeObjectURL(svgUrl);
    svgUrl = '';
    getElement<HTMLElement>('.js-result-empty').hidden = false;
  }
  function setOriginal(url: string, width: number, height: number): void {
    original.src = url;
    original.hidden = false;
    dimensions = { width, height };
    zoom.value = 'fit';
    getElement<HTMLElement>('.js-original-empty').hidden = true;
    resize();
  }
  async function setResult(svg: string): Promise<void> {
    clearResult();
    svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    result.src = svgUrl;
    await result.decode();
    result.hidden = false;
    getElement<HTMLElement>('.js-result-empty').hidden = true;
    resize();
  }
  return { setOriginal, setResult, clearResult };
}
