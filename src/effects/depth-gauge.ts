import { subscribe, onMeasure, getAnchors, getState, docMax, type DepthState } from '../core/scroll-depth';
import { t, onLangChange } from '../i18n';

/**
 * Hiệu ứng phụ 4: thước đo độ sâu cố định ở mép phải, thay cho thanh cuộn.
 * - Kim (chấm + số mét) chạy theo tiến độ cuộn.
 * - Mỗi mốc là một liên kết tới phần tương ứng (dùng được bằng bàn phím).
 * - Kéo hoặc bấm trên thước để cuộn, như thanh cuộn.
 */

let nav: HTMLElement | null = null;
let rail: HTMLElement | null = null;
let ticks: HTMLOListElement | null = null;
let readout: HTMLElement | null = null;
const cleanups: (() => void)[] = [];
let idleTimer = 0;

const fmt = (m: number) =>
  `${new Intl.NumberFormat(document.documentElement.lang === 'en' ? 'en-US' : 'vi-VN').format(Math.round(m))} m`;

function tickLabel(id: string, meters: number) {
  if (id === 'lien-he') return { short: t('contact.depth'), long: t('contact.title') };
  if (id === 'mat-nuoc') return { short: fmt(0), long: `${t('hero.name1')} ${t('hero.name2')}` };
  const heading = document.querySelector(`#${id} h2`)?.textContent?.trim() ?? '';
  return { short: fmt(meters), long: heading };
}

function renderTicks() {
  if (!ticks || !nav) return;
  nav.setAttribute('aria-label', t('nav.gauge'));
  const max = docMax() || 1;
  ticks.replaceChildren(
    ...getAnchors().map((a) => {
      const li = document.createElement('li');
      li.className = 'gauge__tick';
      li.style.setProperty('--at', (a.at / max).toFixed(4));
      const link = document.createElement('a');
      link.href = `#${a.id}`;
      const { short, long } = tickLabel(a.id, a.meters);
      // Nhãn nhìn thấy chỉ hiện khi rê/focus (visibility: hidden lúc thường) → đặt tên truy cập riêng cho liên kết
      link.setAttribute('aria-label', `${short} · ${long}`);
      link.innerHTML = `<span class="gauge__label"><span class="gauge__m"></span> <span class="gauge__name"></span></span>`;
      link.querySelector('.gauge__m')!.textContent = short;
      link.querySelector('.gauge__name')!.textContent = long;
      li.append(link);
      return li;
    }),
  );
}

let lastY = -1;
function render(s: DepthState) {
  if (!nav || !readout) return;
  nav.style.setProperty('--p', s.progress.toFixed(4));
  readout.textContent = fmt(s.meters);
  const moved = lastY >= 0 && Math.abs(s.y - lastY) > 0.5;
  lastY = s.y;
  if (!moved) return;
  // Trên màn nhỏ, số mét chỉ hiện khi đang cuộn rồi lặn đi
  nav.classList.add('is-moving');
  clearTimeout(idleTimer);
  idleTimer = window.setTimeout(() => nav?.classList.remove('is-moving'), 1200);
}

function scrollToPointer(e: PointerEvent) {
  if (!rail) return;
  const r = rail.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
  scrollTo({ top: p * docMax(), behavior: 'instant' as ScrollBehavior });
}

export function init() {
  nav = document.createElement('nav');
  nav.className = 'gauge';
  nav.innerHTML = `
    <div class="gauge__rail" aria-hidden="true">
      <span class="gauge__fill"></span>
      <span class="gauge__needle"><span class="gauge__readout"></span></span>
    </div>
    <ol class="gauge__ticks"></ol>`;
  rail = nav.querySelector('.gauge__rail');
  ticks = nav.querySelector('.gauge__ticks');
  readout = nav.querySelector('.gauge__readout');
  document.body.append(nav);
  document.documentElement.classList.add('has-gauge');

  const down = (e: PointerEvent) => {
    if (e.button !== 0) return;
    rail!.setPointerCapture(e.pointerId);
    nav!.classList.add('is-dragging');
    scrollToPointer(e);
  };
  const move = (e: PointerEvent) => { if (rail!.hasPointerCapture(e.pointerId)) scrollToPointer(e); };
  const up = (e: PointerEvent) => {
    if (rail!.hasPointerCapture(e.pointerId)) rail!.releasePointerCapture(e.pointerId);
    nav!.classList.remove('is-dragging');
  };
  rail!.addEventListener('pointerdown', down);
  rail!.addEventListener('pointermove', move);
  rail!.addEventListener('pointerup', up);
  rail!.addEventListener('pointercancel', up);

  renderTicks();
  cleanups.push(
    subscribe(render),
    onMeasure(renderTicks),
    onLangChange(() => { renderTicks(); render(getState()); }),
  );
  nav.classList.remove('is-moving');
}

export function destroy() {
  cleanups.splice(0).forEach((fn) => fn());
  clearTimeout(idleTimer);
  nav?.remove();
  nav = rail = ticks = readout = null;
  lastY = -1;
  document.documentElement.classList.remove('has-gauge');
}
