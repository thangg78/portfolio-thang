/**
 * Hiệu ứng phụ 5: KARSIA — thanh kéo so sánh trước và sau.
 * Không có JS: hai ảnh nằm cạnh nhau (CSS tĩnh). Có JS: chồng hai ảnh, ảnh "trước" bị cắt theo vị trí thanh kéo.
 * Điều khiển là <input type="range"> phủ lên ảnh → kéo chuột, chạm, phím mũi tên/Home/End đều dùng được.
 * Không phải chuyển động tự chạy nên vẫn bật khi giảm chuyển động.
 */
import { t, onLangChange } from '../i18n';

const cleanups: (() => void)[] = [];

export function init() {
  document.querySelectorAll<HTMLElement>('.compare').forEach((fig) => {
    const pair = fig.querySelector<HTMLElement>('.compare__pair');
    if (!pair) return;
    fig.classList.add('compare--slider');

    const handle = document.createElement('div');
    handle.className = 'compare__handle';
    handle.setAttribute('aria-hidden', 'true');

    const input = document.createElement('input');
    input.type = 'range';
    input.className = 'compare__range';
    input.min = '0';
    input.max = '100';
    input.step = '1';
    input.value = '50';

    const label = () => {
      input.setAttribute('aria-label', t('labels.compareSlider'));
      input.setAttribute('aria-valuetext', `${t('labels.before')} ${input.value}% · ${t('labels.after')} ${100 - Number(input.value)}%`);
    };
    const update = () => {
      pair.style.setProperty('--pos', `${input.value}%`);
      label();
    };
    input.addEventListener('input', update);
    pair.append(handle, input);
    update();
    cleanups.push(onLangChange(label), () => {
      handle.remove();
      input.remove();
      fig.classList.remove('compare--slider');
    });
  });
}

export function destroy() {
  cleanups.splice(0).forEach((fn) => fn());
}
