import { PRESETS } from '../config/presets';
import type { PresetName, TraceSettings } from '../types';
import { getElement } from '../utils/dom';

export function initSettings(onChange: () => void) {
  const form = getElement<HTMLFormElement>('.js-settings');
  const preset = getElement<HTMLSelectElement>('.js-preset');
  const fields = [...form.querySelectorAll<HTMLInputElement | HTMLSelectElement>('.js-setting')];
  function read(): TraceSettings {
    const settings = { ...PRESETS.logo };
    for (const field of fields) {
      const key = field.name as keyof TraceSettings;
      if (key === 'clustering') settings.clustering = field.value as TraceSettings['clustering'];
      else if (key === 'mode') settings.mode = field.value as TraceSettings['mode'];
      else settings[key] = Number(field.value);
    }
    return settings;
  }
  function refresh(): void {
    for (const field of fields) {
      const output = form.querySelector<HTMLOutputElement>(`.js-value[data-for="${field.name}"]`);
      if (output) output.value = field.value;
    }
    const binary = read().clustering === 'bw';
    for (const group of [...form.querySelectorAll<HTMLElement>('.js-color-setting')]) group.hidden = binary;
    getElement<HTMLElement>('.js-binary-setting').hidden = !binary;
  }
  function apply(name: PresetName): void {
    for (const field of fields) field.value = String(PRESETS[name][field.name as keyof TraceSettings]);
    preset.value = name;
    refresh();
  }
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', function (event) {
    if (!(event.target instanceof Element) || !event.target.matches('.js-setting')) return;
    preset.value = 'custom';
    refresh();
    onChange();
  });
  preset.addEventListener('change', function () {
    if (preset.value in PRESETS) { apply(preset.value as PresetName); onChange(); }
  });
  getElement<HTMLButtonElement>('.js-reset-settings').addEventListener('click', function () { apply('logo'); onChange(); });
  apply('logo');
  return { read };
}
